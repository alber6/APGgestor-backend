const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
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
 * Genera la Memoria Técnica oficial en PDF (Comunidad de Madrid).
 * Estrategia: AcroForm nativo — rellena los campos interactivos del PDF oficial.
 * GET /api/jobs/:id/generate-memoria
 */
const generateMemoriaPDF = async (req, res) => {
  console.log("🟢 GENERANDO MEMORIA POR COORDENADAS PARA ID:", req.params.id);
  try {
    const { id } = req.params;

    const job = await Job.findById(id).populate('cliente');
    if (!job) {
      return res.status(404).json({ message: 'Orden de trabajo u obra no encontrada.' });
    }

    let templatePath = path.resolve(__dirname, '../../../templates/memoria.pdf');
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(process.cwd(), 'templates/memoria.pdf');
    }
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ message: 'No se encontró el archivo templates/memoria.pdf' });
    }

    const bufferOriginal = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(bufferOriginal, { ignoreEncryption: true });

    // Obtenemos la primera página y la fuente estándar
    const pages = pdfDoc.getPages();
    const pag1 = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);


    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log("=== COORDENADAS EXACTAS DE CADA CAJA ===");
    fields.forEach(field => {
      const widgets = field.acroField.getWidgets();
      widgets.forEach(widget => {
        const rect = widget.getRectangle();
        console.log(`Caja "${field.getName()}" -> x: ${Math.round(rect.x)}, y: ${Math.round(rect.y)}`);
      });
    });

    const clienteObj = job.cliente || {};
    const esEmpresa = Boolean(clienteObj.es_empresa);

    // Preparar datos
    const nombreTitular = clienteObj.nombre || '';
    const apellido1 = esEmpresa ? '' : (clienteObj.apellido1 || '');
    const apellido2 = esEmpresa ? '' : (clienteObj.apellido2 || '');
    const nifTitular = clienteObj.nif || '';
    const telefonoTit = clienteObj.telefono || '';
    const emailTit = clienteObj.email || '';
    const localidadTit = clienteObj.localidad || '';
    const cpTit = clienteObj.cp || '';

    const direccionTitular = [
      clienteObj.tipo_via || 'CALLE',
      clienteObj.nombre_via || '',
      clienteObj.numero || '',
      clienteObj.piso ? `Piso ${clienteObj.piso}` : '',
      clienteObj.puerta ? `Pta. ${clienteObj.puerta}` : ''
    ].filter(Boolean).join(' ');

    const direccionObra = [
      job.tipo_via_obra || 'CALLE',
      job.nombre_via_obra || '',
      job.numero_obra || '',
      job.piso_obra ? `Piso ${job.piso_obra}` : '',
      job.puerta_obra ? `Pta. ${job.puerta_obra}` : ''
    ].filter(Boolean).join(' ');

    const localidadObra = job.localidad_obra || '';
    const cpObra = job.cp_obra || '';
    const provinciaObra = job.provincia_obra || '';
    const tipoInstalacion = job.tipo_instalacion || '';
    const fechaStr = job.fecha
      ? new Date(job.fecha).toLocaleDateString('es-ES')
      : new Date().toLocaleDateString('es-ES');

    // Helper para pintar texto
    const stamp = (texto, x, y, size = 9) => {
      const val = String(texto || '').trim();
      if (!val) return;
      pag1.drawText(val, { x, y, size, font, color: rgb(0, 0, 0) });
    };

    // 📍 DIBUJAR DATOS EN SUS COORDENADAS (Página 1)
    // BLOQUE TITULAR
    stamp(nombreTitular, 235, 645); // Nombre / Razón Social
    stamp(nifTitular, 340, 658); // NIF
    stamp(apellido1, 200, 631); // Apellido 1º
    stamp(apellido2, 340, 631); // Apellido 2º
    stamp(direccionTitular, 200, 618); // Dirección del titular
    stamp(localidadTit, 200, 606); // Localidad
    stamp(cpTit, 385, 606); // Código Postal

    // BLOQUE EMPLAZAMIENTO OBRA
    stamp(direccionObra, 200, 582); // Dirección de la obra
    stamp(localidadObra, 200, 570); // Localidad de la obra
    stamp(cpObra, 385, 570); // CP de la obra
    stamp(tipoInstalacion, 200, 558); // Tipo de instalación

    const pdfBytes = await pdfDoc.save();
    const fileName = `Memoria_${job.id_trabajo || id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    return res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('❌ Error al generar la Memoria PDF:', error);
    return res.status(500).json({ message: 'Error al generar la Memoria PDF', error: error.message });
  }
};


module.exports = {
  generateJobDocument,
  generateMemoriaPDF
};