const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');

// Helper para validar formato de fecha YYYY-MM-DD
const isValidDateStr = (dateStr) => {
  return typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
};

// =========================================================================
// 1. CREAR SOLICITUD DE VACACIONES / PERMISO (OPERARIO)
// =========================================================================
const createLeaveRequest = async (req, res) => {
  try {
    const usuarioId = req.user._id;
    const { tipo, fechaInicio, fechaFin, comentariosOperario } = req.body;

    if (!tipo || !fechaInicio || !fechaFin) {
      return res.status(400).json({
        message: 'Todos los campos son obligatorios: tipo, fechaInicio y fechaFin.'
      });
    }

    if (!isValidDateStr(fechaInicio) || !isValidDateStr(fechaFin)) {
      return res.status(400).json({
        message: 'El formato de las fechas debe ser YYYY-MM-DD.'
      });
    }

    if (fechaInicio > fechaFin) {
      return res.status(400).json({
        message: 'La fecha de inicio no puede ser posterior a la fecha de fin.'
      });
    }

    // Validación legal: Para VACACIONES y ASUNTOS_PROPIOS no se permiten fechas de inicio pasadas
    const hoy = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date());
    if (['VACACIONES', 'ASUNTOS_PROPIOS'].includes(tipo) && fechaInicio < hoy) {
      return res.status(400).json({
        message: 'No es posible solicitar vacaciones o asuntos propios con fecha de inicio anterior al día de hoy. Solo se permiten fechas pasadas para BAJA o permisos sobrevenidos (OTROS).'
      });
    }

    // Comprobar si ya existe una solicitud en conflicto para estas fechas
    const solicitudExistente = await LeaveRequest.findOne({
      usuario: usuarioId,
      estado: { $in: ['PENDIENTE', 'APROBADA'] },
      $or: [
        { fechaInicio: { $lte: fechaFin }, fechaFin: { $gte: fechaInicio } }
      ]
    });

    if (solicitudExistente) {
      return res.status(400).json({
        message: `Ya tienes una solicitud (${solicitudExistente.tipo} - ${solicitudExistente.estado}) que coincide en ese rango de fechas.`
      });
    }

    const nuevaSolicitud = new LeaveRequest({
      usuario: usuarioId,
      tipo,
      fechaInicio,
      fechaFin,
      estado: 'PENDIENTE',
      comentariosOperario: comentariosOperario || ''
    });

    await nuevaSolicitud.save();

    return res.status(201).json({
      message: 'Solicitud de vacaciones/permiso enviada correctamente. Queda pendiente de aprobación por el Administrador.',
      solicitud: nuevaSolicitud
    });
  } catch (error) {
    console.error('Error al crear solicitud de permiso:', error);
    return res.status(500).json({
      message: 'Error al procesar la solicitud',
      error: error.message
    });
  }
};

// =========================================================================
// 2. MIS SOLICITUDES (VISTA OPERARIO)
// =========================================================================
const getMyLeaveRequests = async (req, res) => {
  try {
    const usuarioId = req.user._id;
    const solicitudes = await LeaveRequest.find({ usuario: usuarioId })
      .populate('revisadoPor', 'nombre rol')
      .sort({ createdAt: -1 });

    return res.json(solicitudes);
  } catch (error) {
    console.error('Error al obtener mis solicitudes:', error);
    return res.status(500).json({
      message: 'Error al recuperar tus solicitudes',
      error: error.message
    });
  }
};

// =========================================================================
// 3. TODAS LAS SOLICITUDES (VISTA ADMINISTRADOR)
// =========================================================================
const getAllLeaveRequests = async (req, res) => {
  try {
    const { usuarioId, estado, mes } = req.query;
    const filtro = {};

    if (usuarioId && usuarioId !== 'todos') {
      filtro.usuario = usuarioId;
    }

    if (estado && estado !== 'TODOS') {
      filtro.estado = estado;
    }

    if (mes) {
      // Coincidencia con fechas que toquen el mes seleccionado
      filtro.$or = [
        { fechaInicio: { $regex: `^${mes}` } },
        { fechaFin: { $regex: `^${mes}` } }
      ];
    }

    const solicitudes = await LeaveRequest.find(filtro)
      .populate('usuario', 'nombre dni rol email')
      .populate('revisadoPor', 'nombre rol')
      .sort({ createdAt: -1 });

    return res.json(solicitudes);
  } catch (error) {
    console.error('Error al listar solicitudes para administrador:', error);
    return res.status(500).json({
      message: 'Error al consultar las solicitudes de permisos',
      error: error.message
    });
  }
};

// =========================================================================
// 4. APROBAR O RECHAZAR SOLICITUD (ADMINISTRADOR)
// =========================================================================
const updateLeaveRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, comentariosAdmin } = req.body;
    const adminId = req.user._id;

    if (!['APROBADA', 'RECHAZADA'].includes(estado)) {
      return res.status(400).json({
        message: 'Estado inválido. Solo se permite APROBADA o RECHAZADA.'
      });
    }

    const solicitud = await LeaveRequest.findById(id).populate('usuario', 'nombre');
    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada.' });
    }

    solicitud.estado = estado;
    solicitud.revisadoPor = adminId;
    solicitud.fechaRevision = new Date();
    if (comentariosAdmin !== undefined) {
      solicitud.comentariosAdmin = comentariosAdmin;
    }

    await solicitud.save();

    return res.json({
      message: `Solicitud de ${solicitud.usuario?.nombre} ha sido ${estado.toLowerCase()} con éxito.`,
      solicitud
    });
  } catch (error) {
    console.error('Error al actualizar estado de solicitud:', error);
    return res.status(500).json({
      message: 'Error al cambiar estado de la solicitud',
      error: error.message
    });
  }
};

// =========================================================================
// 5. CANCELAR SOLICITUD PENDIENTE (OPERARIO)
// =========================================================================
const cancelLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user._id;

    const solicitud = await LeaveRequest.findOne({ _id: id, usuario: usuarioId });
    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada.' });
    }

    if (solicitud.estado !== 'PENDIENTE') {
      return res.status(400).json({
        message: 'No puedes cancelar una solicitud que ya ha sido revisada por la administración.'
      });
    }

    await LeaveRequest.findByIdAndDelete(id);

    return res.json({ message: 'Solicitud cancelada correctamente.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al cancelar la solicitud', error: error.message });
  }
};

module.exports = {
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  updateLeaveRequestStatus,
  cancelLeaveRequest
};
