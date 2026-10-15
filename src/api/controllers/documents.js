const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { PDFDocument } = require('pdf-lib');
const Job = require('../models/Job');

/**
 * Controller para la generación de documentación oficial automática (Boletines, Memorias Técnicas, Solicitudes).
 * POST /api/jobs/:id/generate-docs
 */
const generateJobDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Consulta a MongoDB para obtener la Obra por ID y popular los datos del cliente asociado
    const job = await Job.findById(id).populate('cliente');

    if (!job) {
      return res.status(404).json({ 
        message: 'Orden de trabajo u obra no encontrada.' 
      });
    }

    // 2. Resolver la ruta estática hacia el archivo de plantilla Word (templates/solicitud.docx)
    let templatePath = path.resolve(__dirname, '../../../templates/solicitud.docx');
    
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(process.cwd(), 'templates/solicitud.docx');
    }

    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({
        message: 'No se encontró el archivo de plantilla templates/solicitud.docx en el servidor.'
      });
    }

    // 3. Leer la plantilla Word en binario e inicializar PizZip y Docxtemplater
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const clienteObj = job.cliente || {};

    // 4. Mapear las variables del documento Word con los datos de MongoDB
    const esEmpresa = Boolean(clienteObj.es_empresa);

    doc.render({
      nombre_titular: clienteObj.nombre || '',
      apellido1_titular: clienteObj.es_empresa ? '' : (clienteObj.apellido1 || ''),
      apellido2_titular: clienteObj.es_empresa ? '' : (clienteObj.apellido2 || ''),
      nif_titular: clienteObj.nif || '',
      nombre_referencia: clienteObj.nombre_referencia || '',
      nombre_referencia_titular: clienteObj.nombre_referencia || '',
      
      // Desglose Granular Dirección Titular
      tipo_via: clienteObj.tipo_via || 'CALLE',
      tipo_via_titular: clienteObj.tipo_via || 'CALLE',
      nombre_via: clienteObj.nombre_via || '',
      nombre_via_titular: clienteObj.nombre_via || '',
      numero: clienteObj.numero || '',
      num_titular: clienteObj.numero || '',
      bloque: clienteObj.bloque || '',
      bloque_titular: clienteObj.bloque || '',
      portal: clienteObj.portal || '',
      portal_titular: clienteObj.portal || '',
      escalera: clienteObj.escalera || '',
      escalera_titular: clienteObj.escalera || '',
      piso: clienteObj.piso || '',
      piso_titular: clienteObj.piso || '',
      puerta: clienteObj.puerta || '',
      puerta_titular: clienteObj.puerta || '',

      // Desglose Granular Dirección Obra
      tipo_via_obra: job.tipo_via_obra || 'CALLE',
      nombre_via_obra: job.nombre_via_obra || '',
      numero_obra: job.numero_obra || '',
      num_obra: job.numero_obra || '',
      bloque_obra: job.bloque_obra || '',
      portal_obra: job.portal_obra || '',
      escalera_obra: job.escalera_obra || '',
      piso_obra: job.piso_obra || '',
      puerta_obra: job.puerta_obra || '',
      direccion_obra: job.direccion_obra || `${job.tipo_via_obra || 'CALLE'} ${job.nombre_via_obra || ''} ${job.numero_obra || ''}`.trim(),
      localidad_obra: job.localidad_obra || '',
      
      // Variables de representación legal (Entidad Jurídica / Empresa)
      es_empresa: esEmpresa ? 'SÍ' : 'NO',
      nif_rep: esEmpresa ? (clienteObj.representante_nif || '') : '',
      nombre_rep: esEmpresa ? (clienteObj.representante_nombre || '') : '',
      apellido1_rep: esEmpresa ? (clienteObj.representante_apellido1 || '') : '',
      apellido2_rep: esEmpresa ? (clienteObj.representante_apellido2 || '') : '',
      correo_rep: esEmpresa ? (clienteObj.rep_correo || '') : '',
      tipo_via_rep: esEmpresa ? (clienteObj.rep_tipo_via || '') : '',
      nombre_via_rep: esEmpresa ? (clienteObj.rep_nombre_via || '') : '',
      num_rep: esEmpresa ? (clienteObj.rep_numero || '') : '',
      bloque_rep: esEmpresa ? (clienteObj.rep_bloque || '') : '',
      portal_rep: esEmpresa ? (clienteObj.rep_portal || '') : '',
      escalera_rep: esEmpresa ? (clienteObj.rep_escalera || '') : '',
      piso_rep: esEmpresa ? (clienteObj.rep_piso || '') : '',
      puerta_rep: esEmpresa ? (clienteObj.rep_puerta || '') : '',
      localidad_rep: esEmpresa ? (clienteObj.rep_localidad || '') : '',
      provincia_rep: esEmpresa ? (clienteObj.rep_provincia || '') : '',
      cp_rep: esEmpresa ? (clienteObj.rep_cp || '') : '',
      tel_fijo_rep: esEmpresa ? (clienteObj.rep_tel_fijo || '') : '',
      tel_movil_rep: esEmpresa ? (clienteObj.rep_tel_movil || '') : '',
      rep_nombre: esEmpresa ? (clienteObj.representante_nombre || '') : '',
      rep_apellido1: esEmpresa ? (clienteObj.representante_apellido1 || '') : '',
      rep_apellido2: esEmpresa ? (clienteObj.representante_apellido2 || '') : '',
      rep_nif: esEmpresa ? (clienteObj.representante_nif || '') : '',
      rep_nombre_completo: esEmpresa ? `${clienteObj.representante_nombre || ''} ${clienteObj.representante_apellido1 || ''} ${clienteObj.representante_apellido2 || ''}`.trim() : '',

      // Campos complementarios útiles para plantillas avanzadas
      telefono_titular: clienteObj.telefono || '',
      email_titular: clienteObj.email || '',
      direccion_fiscal: clienteObj.direccion_fiscal || clienteObj.direccion || '',
      localidad_titular: clienteObj.localidad || '',
      provincia_titular: clienteObj.provincia || '',
      cp_titular: clienteObj.cp || '',
      cp_obra: job.cp_obra || '',
      provincia_obra: job.provincia_obra || '',
      tipo_instalacion: job.tipo_instalacion || '',
      precio: job.precio || 0,
      id_trabajo: job.id_trabajo || job._id,
      estado: job.estado || '',
      notas: job.notas || '',
      fecha: job.fecha ? new Date(job.fecha).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES')
    });

    // 5. Generar el buffer comprimido del documento final (.docx)
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // 6. Configurar headers de respuesta HTTP para forzar la descarga del archivo .docx
    const fileName = `Solicitud_${job.id_trabajo || id}.docx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Access-Control-Expose-Headers': 'Content-Disposition'
    });

    return res.send(buffer);

  } catch (error) {
    console.error('Error al procesar la plantilla Word docxtemplater:', error);
    return res.status(500).json({ 
      message: 'Error al procesar la plantilla Word para la generación del documento.', 
      error: error.message 
    });
  }
};

/**
 * Controller para la generación de la Memoria Técnica oficial en PDF.
 * Utiliza el PDF oficial de la Comunidad de Madrid como plantilla de formulario.
 * GET /api/jobs/:id/generate-memoria
 */
const generateMemoriaPDF = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Consulta a MongoDB para obtener la Obra por ID y popular los datos del cliente
    const job = await Job.findById(id).populate('cliente');

    if (!job) {
      return res.status(404).json({
        message: 'Orden de trabajo u obra no encontrada.'
      });
    }

    // 2. Resolver la ruta estática hacia el PDF oficial de la Comunidad de Madrid
    let templatePath = path.resolve(__dirname, '../../../templates/memoria.pdf');

    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(process.cwd(), 'templates/memoria.pdf');
    }

    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({
        message: 'No se encontró el archivo de plantilla templates/memoria.pdf en el servidor.'
      });
    }

    // 3. Leer el PDF en buffer y cargarlo con pdf-lib
    const pdfBuffer = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const form = pdfDoc.getForm();

    // 4. =========================================================
    //    INSPECCIÓN: Imprimir todos los nombres de campo técnico
    //    del PDF oficial de la Comunidad de Madrid
    // =========================================================
    console.log('\n============================================================');
    console.log('  📋 CAMPOS DEL FORMULARIO PDF - MEMORIA COMUNIDAD DE MADRID');
    console.log('============================================================');
    const fields = form.getFields();
    fields.forEach((field, index) => {
      const tipo = field.constructor.name;
      console.log(`  [${String(index + 1).padStart(3, '0')}] [${tipo.padEnd(20)}] → "${field.getName()}"`);
    });
    console.log(`  Total de campos detectados: ${fields.length}`);
    console.log('============================================================\n');

    // 5. Preparar los datos del job y del cliente
    const clienteObj = job.cliente || {};
    const esEmpresa = Boolean(clienteObj.es_empresa);

    // Helper para rellenar campo de texto de forma segura con try-catch individual
    const setField = (nombreCampo, valor) => {
      try {
        const field = form.getTextField(nombreCampo);
        field.setText(String(valor || ''));
      } catch (e) {
        // Campo no encontrado o no es un TextField: lo registramos pero no bloqueamos
        console.warn(`  ⚠️  Campo no encontrado o incompatible: "${nombreCampo}" → ${e.message}`);
      }
    };

    // Helper para marcar checkboxes de forma segura
    const setCheckbox = (nombreCampo, valor) => {
      try {
        const field = form.getCheckBox(nombreCampo);
        if (valor) { field.check(); } else { field.uncheck(); }
      } catch (e) {
        console.warn(`  ⚠️  Checkbox no encontrado: "${nombreCampo}" → ${e.message}`);
      }
    };

    // 6. =========================================================
    //    INYECCIÓN DE DATOS - Campos principales del titular
    // =========================================================
    // NOTA: Los nombres de campo reales se conocerán tras la inspección del console.log anterior.
    // Los siguientes son los nombres comunes en el PDF oficial CAM; ajustar según output.

    // --- Titular / Solicitante ---
    setField('nombre_titular', clienteObj.nombre || '');
    setField('apellido1_titular', esEmpresa ? '' : (clienteObj.apellido1 || ''));
    setField('apellido2_titular', esEmpresa ? '' : (clienteObj.apellido2 || ''));
    setField('nif_titular', clienteObj.nif || '');
    setField('nombre_referencia', clienteObj.nombre_referencia || '');

    // --- Dirección del titular ---
    setField('tipo_via_titular', clienteObj.tipo_via || 'CALLE');
    setField('nombre_via_titular', clienteObj.nombre_via || '');
    setField('num_titular', clienteObj.numero || '');
    setField('bloque_titular', clienteObj.bloque || '');
    setField('portal_titular', clienteObj.portal || '');
    setField('escalera_titular', clienteObj.escalera || '');
    setField('piso_titular', clienteObj.piso || '');
    setField('puerta_titular', clienteObj.puerta || '');
    setField('localidad_titular', clienteObj.localidad || '');
    setField('provincia_titular', clienteObj.provincia || '');
    setField('cp_titular', clienteObj.cp || '');
    setField('telefono_titular', clienteObj.telefono || '');
    setField('email_titular', clienteObj.email || '');

    // --- Dirección de la obra / instalación ---
    setField('tipo_via_obra', job.tipo_via_obra || 'CALLE');
    setField('nombre_via_obra', job.nombre_via_obra || '');
    setField('numero_obra', job.numero_obra || '');
    setField('bloque_obra', job.bloque_obra || '');
    setField('portal_obra', job.portal_obra || '');
    setField('escalera_obra', job.escalera_obra || '');
    setField('piso_obra', job.piso_obra || '');
    setField('puerta_obra', job.puerta_obra || '');
    setField('localidad_obra', job.localidad_obra || '');
    setField('cp_obra', job.cp_obra || '');
    setField('provincia_obra', job.provincia_obra || '');

    // --- Representante legal (sólo si es empresa) ---
    setField('nombre_rep', esEmpresa ? (clienteObj.representante_nombre || '') : '');
    setField('apellido1_rep', esEmpresa ? (clienteObj.representante_apellido1 || '') : '');
    setField('apellido2_rep', esEmpresa ? (clienteObj.representante_apellido2 || '') : '');
    setField('nif_rep', esEmpresa ? (clienteObj.representante_nif || '') : '');

    // --- Datos de la instalación ---
    setField('tipo_instalacion', job.tipo_instalacion || '');
    setField('fecha', job.fecha
      ? new Date(job.fecha).toLocaleDateString('es-ES')
      : new Date().toLocaleDateString('es-ES')
    );

    // --- Checkbox empresa (si el PDF lo tiene) ---
    setCheckbox('es_empresa', esEmpresa);

    // 7. Aplanar el formulario (hace los campos no editables y los "quema" en el PDF)
    form.flatten();

    // 8. Serializar el PDF en bytes
    const pdfBytes = await pdfDoc.save();

    // 9. Configurar headers y enviar el PDF resultante como respuesta binaria
    const fileName = `Memoria_${job.id_trabajo || id}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Access-Control-Expose-Headers': 'Content-Disposition'
    });

    return res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('Error al procesar la plantilla PDF de Memoria:', error);
    return res.status(500).json({
      message: 'Error al procesar el PDF de Memoria Técnica.',
      error: error.message
    });
  }
};

module.exports = {
  generateJobDocument,
  generateMemoriaPDF
};
