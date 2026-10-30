const TimeRecord = require('../models/TimeRecord');
const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');
const { generateTimeRecordPDF } = require('../../utils/timeRecordPdf');

// Helper para obtener la fecha 'YYYY-MM-DD' en la zona horaria de España
const getMadridDateString = (date = new Date()) => {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(date);
};

// Helper para formatear horas y minutos HH:MM en España
const formatMadridTime = (date) => {
  if (!date) return '--:--';
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid'
  }).format(new Date(date));
};

/**
 * Función auxiliar para agrupar registros por jornada y calcular:
 * - Hora de entrada
 * - Hora inicio y fin de pausas
 * - Hora de salida
 * - Horas ordinarias (hasta 8h/día)
 * - Horas extraordinarias (exceso sobre 8h/día)
 * - Horas totales
 */
const calcularJornadas = (registros, permisosAprobados = []) => {
  // Agrupar registros por día 'YYYY-MM-DD'
  const agrupadoPorDia = {};

  registros.forEach((reg) => {
    const f = reg.fecha;
    if (!agrupadoPorDia[f]) {
      agrupadoPorDia[f] = [];
    }
    agrupadoPorDia[f].push(reg);
  });

  const diasCalculados = [];
  let totalHorasOrdinarias = 0;
  let totalHorasExtra = 0;
  let totalHorasTrabajadas = 0;

  // Mapa de días con permiso o vacaciones aprobadas
  const diasPermisoMap = {};
  permisosAprobados.forEach((perm) => {
    if (!perm.fechaInicio || !perm.fechaFin) return;
    let curr = new Date(perm.fechaInicio);
    const fin = new Date(perm.fechaFin);
    while (curr <= fin) {
      const fechaISO = curr.toISOString().split('T')[0];
      diasPermisoMap[fechaISO] = perm;
      curr.setDate(curr.getDate() + 1);
    }
  });

  // Ordenar días con registros cronológicamente
  const fechasOrdenadas = Object.keys(agrupadoPorDia).sort();

  fechasOrdenadas.forEach((fechaStr) => {
    const regsDelDia = agrupadoPorDia[fechaStr].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let primeraEntrada = null;
    let ultimaSalida = null;
    let primeraPausaInicio = null;
    let primeraPausaFin = null;
    let tieneManual = false;
    let tieneGeo = false;

    // Calcular tiempo efectivo de trabajo
    let minutosTrabajados = 0;
    let entradaActual = null;
    let pausaActual = null;

    regsDelDia.forEach((r) => {
      if (r.origen === 'manual_admin' || (r.auditTrail && r.auditTrail.length > 0)) {
        tieneManual = true;
      }
      if (r.geolocalizacion && r.geolocalizacion.capturada) {
        tieneGeo = true;
      }

      if (r.tipo === 'ENTRADA') {
        if (!primeraEntrada) primeraEntrada = r.timestamp;
        entradaActual = new Date(r.timestamp);
      } else if (r.tipo === 'PAUSA_INICIO') {
        if (!primeraPausaInicio) primeraPausaInicio = r.timestamp;
        if (entradaActual) {
          minutosTrabajados += (new Date(r.timestamp) - entradaActual) / (1000 * 60);
          entradaActual = null;
        }
        pausaActual = new Date(r.timestamp);
      } else if (r.tipo === 'PAUSA_FIN') {
        if (!primeraPausaFin) primeraPausaFin = r.timestamp;
        pausaActual = null;
        entradaActual = new Date(r.timestamp);
      } else if (r.tipo === 'SALIDA') {
        ultimaSalida = r.timestamp;
        if (entradaActual) {
          minutosTrabajados += (new Date(r.timestamp) - entradaActual) / (1000 * 60);
          entradaActual = null;
        }
      }
    });

    const horasTotalesDia = Math.max(0, minutosTrabajados / 60);
    const horasOrdinariasDia = Math.min(8, horasTotalesDia);
    const horasExtraDia = Math.max(0, horasTotalesDia - 8);

    totalHorasOrdinarias += horasOrdinariasDia;
    totalHorasExtra += horasExtraDia;
    totalHorasTrabajadas += horasTotalesDia;

    const tienePermisoHoy = diasPermisoMap[fechaStr];

    diasCalculados.push({
      fecha: fechaStr,
      entrada: formatMadridTime(primeraEntrada),
      pausaInicio: formatMadridTime(primeraPausaInicio),
      pausaFin: formatMadridTime(primeraPausaFin),
      salida: formatMadridTime(ultimaSalida),
      horasOrdinarias: horasOrdinariasDia,
      horasExtra: horasExtraDia,
      totalHoras: horasTotalesDia,
      manual: tieneManual,
      geolocalizacion: tieneGeo,
      esVacaciones: Boolean(tienePermisoHoy),
      tipoPermiso: tienePermisoHoy ? `${tienePermisoHoy.tipo} (Ausencia Justificada)` : null,
      registros: regsDelDia
    });
  });

  // Integrar días de vacaciones / permisos aprobados donde el empleado no fichó (ausencia total justificada)
  Object.keys(diasPermisoMap).forEach((fechaPermiso) => {
    const yaRegistrado = diasCalculados.some((d) => d.fecha === fechaPermiso);
    if (!yaRegistrado) {
      const perm = diasPermisoMap[fechaPermiso];
      diasCalculados.push({
        fecha: fechaPermiso,
        entrada: perm.tipo,
        pausaInicio: '--:--',
        pausaFin: '--:--',
        salida: perm.tipo,
        horasOrdinarias: 0,
        horasExtra: 0,
        totalHoras: 0,
        manual: false,
        geolocalizacion: false,
        esVacaciones: true,
        tipoPermiso: `${perm.tipo} (Ausencia Justificada)`,
        trabajador: perm.usuario,
        registros: []
      });
    }
  });

  // Reordenar todos los días cronológicamente
  diasCalculados.sort((a, b) => a.fecha.localeCompare(b.fecha));

  return {
    dias: diasCalculados,
    totalHorasOrdinarias,
    totalHorasExtra,
    totalHorasTrabajadas
  };
};

// =========================================================================
// 1. REGISTRAR FICHAJE (ENTRADA, PAUSA, REANUDAR, SALIDA)
// =========================================================================
const punch = async (req, res) => {
  try {
    const usuarioId = req.user._id;
    const { tipo, geolocalizacion, observaciones } = req.body;

    const tiposValidos = ['ENTRADA', 'PAUSA_INICIO', 'PAUSA_FIN', 'SALIDA'];
    if (!tipo || !tiposValidos.includes(tipo)) {
      return res.status(400).json({
        message: 'Tipo de fichaje inválido. Valores permitidos: ENTRADA, PAUSA_INICIO, PAUSA_FIN, SALIDA'
      });
    }

    const now = new Date();
    const fechaHoy = getMadridDateString(now);

    const nuevoFichaje = new TimeRecord({
      usuario: usuarioId,
      tipo,
      timestamp: now,
      fecha: fechaHoy,
      geolocalizacion: {
        latitud: geolocalizacion?.latitud || null,
        longitud: geolocalizacion?.longitud || null,
        precision: geolocalizacion?.precision || null,
        capturada: Boolean(geolocalizacion?.latitud && geolocalizacion?.longitud),
        direccionAprox: geolocalizacion?.direccionAprox || ''
      },
      dispositivo: req.headers['user-agent'] || 'Dispositivo Móvil / Web',
      origen: 'dispositivo',
      observaciones: observaciones || ''
    });

    await nuevoFichaje.save();

    return res.status(201).json({
      message: `Fichaje de ${tipo} registrado con éxito`,
      fichaje: nuevoFichaje
    });
  } catch (error) {
    console.error('Error al registrar fichaje:', error);
    return res.status(500).json({
      message: 'Error al registrar el fichaje en el servidor',
      error: error.message
    });
  }
};

// =========================================================================
// 2. ESTADO ACTUAL DEL OPERARIO EN LA JORNADA
// =========================================================================
const getCurrentStatus = async (req, res) => {
  try {
    const usuarioId = req.user._id;
    const fechaHoy = getMadridDateString(new Date());

    const registrosHoy = await TimeRecord.find({
      usuario: usuarioId,
      fecha: fechaHoy
    }).sort({ timestamp: 1 });

    let estado = 'FUERA'; // 'TRABAJANDO', 'EN_PAUSA', 'FUERA'
    let ultimoRegistro = null;

    if (registrosHoy.length > 0) {
      ultimoRegistro = registrosHoy[registrosHoy.length - 1];
      if (ultimoRegistro.tipo === 'ENTRADA' || ultimoRegistro.tipo === 'PAUSA_FIN') {
        estado = 'TRABAJANDO';
      } else if (ultimoRegistro.tipo === 'PAUSA_INICIO') {
        estado = 'EN_PAUSA';
      } else if (ultimoRegistro.tipo === 'SALIDA') {
        estado = 'FUERA';
      }
    }

    // Calcular minutos transcurridos hoy
    let minutosHoy = 0;
    let entradaMomento = null;

    registrosHoy.forEach((r) => {
      if (r.tipo === 'ENTRADA' || r.tipo === 'PAUSA_FIN') {
        entradaMomento = new Date(r.timestamp);
      } else if (r.tipo === 'PAUSA_INICIO' || r.tipo === 'SALIDA') {
        if (entradaMomento) {
          minutosHoy += (new Date(r.timestamp) - entradaMomento) / (1000 * 60);
          entradaMomento = null;
        }
      }
    });

    // Si actualmente está trabajando, sumar hasta el momento actual
    if (estado === 'TRABAJANDO' && entradaMomento) {
      minutosHoy += (new Date() - entradaMomento) / (1000 * 60);
    }

    // Comprobar si el usuario tiene vacaciones o permiso APROBADO para el día de hoy
    const permisoHoy = await LeaveRequest.findOne({
      usuario: usuarioId,
      estado: 'APROBADA',
      fechaInicio: { $lte: fechaHoy },
      fechaFin: { $gte: fechaHoy }
    });

    if (permisoHoy && registrosHoy.length === 0) {
      estado = 'VACACIONES';
    }

    return res.json({
      estado,
      ultimoRegistro,
      registrosHoy,
      minutosTrabajadosHoy: Math.round(minutosHoy),
      horasTrabajadasHoy: (minutosHoy / 60).toFixed(2),
      permisoHoy: permisoHoy ? {
        tipo: permisoHoy.tipo,
        fechaInicio: permisoHoy.fechaInicio,
        fechaFin: permisoHoy.fechaFin,
        comentarios: permisoHoy.comentariosOperario
      } : null
    });
  } catch (error) {
    console.error('Error al obtener estado horario:', error);
    return res.status(500).json({
      message: 'Error al consultar el estado de fichaje',
      error: error.message
    });
  }
};

// =========================================================================
// 3. MIS REGISTROS (TRANSPARENCIA LEGAL PARA EL OPERARIO)
// =========================================================================
const getMyRecords = async (req, res) => {
  try {
    const usuarioId = req.user._id;
    const { mes, fecha } = req.query;

    const filtro = { usuario: usuarioId };
    if (fecha) {
      filtro.fecha = fecha;
    } else if (mes) {
      filtro.fecha = { $regex: `^${mes}` };
    }

    const registros = await TimeRecord.find(filtro).sort({ timestamp: -1 });
    return res.json(registros);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener registros', error: error.message });
  }
};

// =========================================================================
// 4. PANEL AUDITORÍA ADMINISTRADOR: LISTAR TODOS CON FILTROS Y CÓMPUTOS
// =========================================================================
const getAllRecords = async (req, res) => {
  try {
    const { usuarioId, mes, fecha } = req.query;
    const filtro = {};

    if (usuarioId && usuarioId !== 'todos') {
      filtro.usuario = usuarioId;
    }

    if (fecha) {
      filtro.fecha = fecha;
    } else if (mes) {
      // mes en formato 'YYYY-MM'
      filtro.fecha = { $regex: `^${mes}` };
    }

    const registros = await TimeRecord.find(filtro)
      .populate('usuario', 'nombre dni rol')
      .populate('auditTrail.modificadoPor', 'nombre rol')
      .sort({ timestamp: -1 });

    // Cálculo consolidado de horas si se filtra por usuario concreto o en general
    const calculo = calcularJornadas(registros);

    // Consultar permisos y vacaciones aprobadas para el período
    const filtroLeave = { estado: 'APROBADA' };
    if (usuarioId && usuarioId !== 'todos') {
      filtroLeave.usuario = usuarioId;
    }
    if (mes) {
      filtroLeave.$or = [
        { fechaInicio: { $regex: `^${mes}` } },
        { fechaFin: { $regex: `^${mes}` } }
      ];
    }
    const permisosAprobados = await LeaveRequest.find(filtroLeave).populate('usuario', 'nombre dni');

    return res.json({
      totalRegistros: registros.length,
      resumen: calculo,
      registros,
      permisosAprobados
    });
  } catch (error) {
    console.error('Error al consultar registros de control horario:', error);
    return res.status(500).json({
      message: 'Error al consultar los registros de auditoría',
      error: error.message
    });
  }
};

// =========================================================================
// 5. ADMINISTRADOR: CREAR FICHAJE MANUAL (CON MOTIVO AUDITADO OBLIGATORIO)
// =========================================================================
const createManualRecord = async (req, res) => {
  try {
    const adminUser = req.user;
    const { usuarioId, tipo, timestamp, fecha, observaciones, motivo } = req.body;

    if (!motivo || !motivo.trim()) {
      return res.status(400).json({
        message: 'Por cumplimiento legal (RD-ley 8/2019), es obligatorio indicar un motivo justificado para crear un fichaje manual.'
      });
    }

    if (!usuarioId || !tipo) {
      return res.status(400).json({ message: 'Faltan campos obligatorios: usuarioId y tipo.' });
    }

    const trabajador = await User.findById(usuarioId);
    if (!trabajador) {
      return res.status(404).json({ message: 'Trabajador no encontrado.' });
    }

    const fechaFichaje = timestamp ? new Date(timestamp) : new Date();
    const fechaStr = fecha || getMadridDateString(fechaFichaje);

    const nuevoFichaje = new TimeRecord({
      usuario: usuarioId,
      tipo,
      timestamp: fechaFichaje,
      fecha: fechaStr,
      origen: 'manual_admin',
      observaciones: observaciones || '',
      geolocalizacion: {
        capturada: false,
        direccionAprox: 'Registro añadido manualmente por la administración'
      },
      auditTrail: [
        {
          modificadoPor: adminUser._id,
          nombreModificador: adminUser.nombre,
          fechaModificacion: new Date(),
          cambio: `Alta manual de fichaje (${tipo})`,
          valoresNuevos: {
            tipo,
            timestamp: fechaFichaje,
            fecha: fechaStr
          },
          motivo: motivo.trim()
        }
      ]
    });

    await nuevoFichaje.save();

    return res.status(201).json({
      message: 'Fichaje manual creado y auditado conforme a la ley',
      fichaje: nuevoFichaje
    });
  } catch (error) {
    console.error('Error al crear fichaje manual:', error);
    return res.status(500).json({
      message: 'Error al dar de alta el fichaje manual',
      error: error.message
    });
  }
};

// =========================================================================
// 6. ADMINISTRADOR: MODIFICAR FICHAJE (CON AUDIT TRAIL Y MOTIVO OBLIGATORIO)
// =========================================================================
const updateRecord = async (req, res) => {
  try {
    const adminUser = req.user;
    const { id } = req.params;
    const { tipo, timestamp, fecha, observaciones, motivo } = req.body;

    if (!motivo || !motivo.trim()) {
      return res.status(400).json({
        message: 'Por imperativo legal (RD-ley 8/2019), cualquier modificación exige un motivo justificado que quedará registrado en la auditoría inalterable.'
      });
    }

    const record = await TimeRecord.findById(id);
    if (!record) {
      return res.status(404).json({ message: 'Registro de fichaje no encontrado.' });
    }

    // Capturar valores anteriores para la pista de auditoría legal
    const valoresAnteriores = {
      tipo: record.tipo,
      timestamp: record.timestamp,
      fecha: record.fecha,
      observaciones: record.observaciones
    };

    const nuevosValores = {};
    if (tipo) {
      record.tipo = tipo;
      nuevosValores.tipo = tipo;
    }
    if (timestamp) {
      const d = new Date(timestamp);
      record.timestamp = d;
      record.fecha = fecha || getMadridDateString(d);
      nuevosValores.timestamp = d;
      nuevosValores.fecha = record.fecha;
    }
    if (observaciones !== undefined) {
      record.observaciones = observaciones;
      nuevosValores.observaciones = observaciones;
    }

    // Registrar en Audit Trail inalterable
    record.auditTrail.push({
      modificadoPor: adminUser._id,
      nombreModificador: adminUser.nombre,
      fechaModificacion: new Date(),
      cambio: 'Modificación de registro horario por el Administrador',
      valoresAnteriores,
      valoresNuevos: nuevosValores,
      motivo: motivo.trim()
    });

    await record.save();

    return res.json({
      message: 'Registro horario actualizado con trazabilidad y auditoría legal completa',
      fichaje: record
    });
  } catch (error) {
    console.error('Error al actualizar fichaje:', error);
    return res.status(500).json({
      message: 'Error al actualizar el registro horario',
      error: error.message
    });
  }
};

// =========================================================================
// 7. BLOQUEO LEGAL DE ELIMINACIÓN
// =========================================================================
const deleteRecord = async (req, res) => {
  return res.status(403).json({
    message: 'PROHIBIDA LA ELIMINACIÓN DIRECTA: Conforme al Real Decreto-ley 8/2019 y art. 34.9 del Estatuto de los Trabajadores, los registros de jornada son inalterables y deben conservarse durante un mínimo de 4 años para garantizar la seguridad jurídica ante la Inspección de Trabajo. Para rectificaciones, utilice la edición auditada con motivo justificado.'
  });
};

// =========================================================================
// 8. EXPORTACIÓN LEGAL EN CSV / EXCEL
// =========================================================================
const exportCSV = async (req, res) => {
  try {
    const { usuarioId, mes } = req.query;
    const mesConsultado = mes || getMadridDateString().substring(0, 7);

    const filtro = {
      fecha: { $regex: `^${mesConsultado}` }
    };
    if (usuarioId && usuarioId !== 'todos') {
      filtro.usuario = usuarioId;
    }

    const registros = await TimeRecord.find(filtro)
      .populate('usuario', 'nombre dni rol')
      .populate('auditTrail.modificadoPor', 'nombre')
      .sort({ timestamp: 1 });

    const calculo = calcularJornadas(registros);

    // Cabecera CSV en formato estándar en España (separado por punto y coma, UTF-8 con BOM para Excel)
    let csv = '\uFEFF';
    csv += 'INFORME OFICIAL DE REGISTRO HORARIO (Real Decreto-ley 8/2019)\n';
    csv += `Empresa: APG Instalaciones Eléctricas S.L.;CIF: B-88765432;Mes: ${mesConsultado}\n\n`;
    csv += 'Fecha;Trabajador;DNI;Hora Entrada;Inicio Pausa;Fin Pausa;Hora Salida;Horas Ordinarias;Horas Extraordinarias;Total Horas;Geolocalización GPS;Modificado/Auditado;Motivo Última Modificación\n';

    calculo.dias.forEach((dia) => {
      // Buscar información del trabajador en los registros del día
      const primerReg = dia.registros && dia.registros[0];
      const nombreTrabajador = primerReg?.usuario?.nombre || 'Varios / General';
      const dniTrabajador = primerReg?.usuario?.dni || '-';

      const ultimoCambio = dia.registros.flatMap(r => r.auditTrail || []).slice(-1)[0];
      const motivoCambio = ultimoCambio ? `"${ultimoCambio.motivo.replace(/"/g, '""')}"` : 'Sin modificaciones';

      csv += [
        dia.fecha,
        nombreTrabajador,
        dniTrabajador,
        dia.entrada || '--:--',
        dia.pausaInicio || '--:--',
        dia.pausaFin || '--:--',
        dia.salida || '--:--',
        dia.horasOrdinarias.toFixed(2).replace('.', ','),
        dia.horasExtra.toFixed(2).replace('.', ','),
        dia.totalHoras.toFixed(2).replace('.', ','),
        dia.geolocalizacion ? 'Verificado GPS' : 'Manual',
        dia.manual ? 'SÍ (Auditado)' : 'NO',
        motivoCambio
      ].join(';') + '\n';
    });

    csv += '\n';
    csv += `;;;;;TOTALES MENSUALES:;${calculo.totalHorasOrdinarias.toFixed(2).replace('.', ',')};${calculo.totalHorasExtra.toFixed(2).replace('.', ',')};${calculo.totalHorasTrabajadas.toFixed(2).replace('.', ',')};;;\n`;

    const filename = `Registro_Horario_${mesConsultado}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    return res.send(Buffer.from(csv, 'utf-8'));
  } catch (error) {
    console.error('Error al exportar CSV:', error);
    return res.status(500).json({ message: 'Error al generar CSV', error: error.message });
  }
};

// =========================================================================
// 9. EXPORTACIÓN LEGAL EN PDF OFICIAL (INSPECCIÓN DE TRABAJO)
// =========================================================================
const exportPDF = async (req, res) => {
  try {
    const { usuarioId, mes } = req.query;
    const mesConsultado = mes || getMadridDateString().substring(0, 7);

    const filtro = {
      fecha: { $regex: `^${mesConsultado}` }
    };

    let trabajadorInfo = {
      nombre: 'Plantilla General',
      dni: 'General',
      rol: 'Operarios'
    };

    if (usuarioId && usuarioId !== 'todos') {
      filtro.usuario = usuarioId;
      const user = await User.findById(usuarioId);
      if (user) {
        trabajadorInfo = {
          nombre: user.nombre,
          dni: user.dni || 'Sin DNI registrado',
          rol: user.rol || 'operario'
        };
      }
    }

    const registros = await TimeRecord.find(filtro)
      .populate('usuario', 'nombre dni rol')
      .sort({ timestamp: 1 });

    const calculo = calcularJornadas(registros);

    const pdfBuffer = await generateTimeRecordPDF({
      empresa: {
        nombre: 'APG Instalaciones Eléctricas S.L.',
        nif: 'B-88765432',
        direccion: 'Calle Gran Vía 15, 28013 Madrid'
      },
      trabajador: trabajadorInfo,
      mes: mesConsultado,
      resumen: calculo
    });

    const filename = `Registro_Jornada_${trabajadorInfo.nombre.replace(/\s+/g, '_')}_${mesConsultado}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar PDF oficial de jornada:', error);
    return res.status(500).json({ message: 'Error al generar PDF oficial', error: error.message });
  }
};

module.exports = {
  punch,
  getCurrentStatus,
  getMyRecords,
  getAllRecords,
  createManualRecord,
  updateRecord,
  deleteRecord,
  exportCSV,
  exportPDF
};
