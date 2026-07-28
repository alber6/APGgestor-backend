const Job = require('../models/Job');

/**
 * REGLA ESTRICTA DE VISIBILIDAD DE PDFs POR ROL:
 * - Si el usuario es 'admin', devuelve la lista de documentos completa.
 * - Si el usuario es 'operario' (o no especificado), filtra el array de documentos
 *   y devuelve ÚNICAMENTE los documentos de tipo 'plano_electrico'.
 */
const applyPdfRoleFilter = (jobDoc, userRole) => {
  if (!jobDoc) return jobDoc;
  const job = jobDoc.toObject ? jobDoc.toObject() : { ...jobDoc };

  if (userRole === 'operario') {
    job.documentos = (job.documentos || []).filter(
      doc => doc.tipo === 'plano_electrico'
    );
  }
  // Si userRole === 'admin', se devuelven todos los documentos completos
  return job;
};

// Obtener todos los trabajos (Populate) para el Dashboard de la oficina y del operario
const getJobs = async (req, res) => {
  try {
    const userRole = req.user?.rol || 'operario'; // Por defecto restrictivo
    const jobs = await Job.find()
      .populate('cliente', 'nombre telefono direccion tipo_vivienda')
      .populate('clienteFacturacion', 'nombre telefono direccion NIF CIF')
      .populate('clienteUbicacion', 'nombre telefono direccion')
      .populate('operario', 'nombre especialidad')
      .populate('operarios', 'nombre especialidad')
      .sort({ fecha: -1 });

    const filteredJobs = jobs.map(job => applyPdfRoleFilter(job, userRole));
    res.json(filteredJobs);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener las órdenes de trabajo', 
      error: error.message 
    });
  }
};

// Obtener trabajos de un operario específico
const getJobsByOperator = async (req, res) => {
  try {
    const userRole = req.user?.rol || 'operario';
    const operatorId = req.params.operatorId;

    const operatorJobs = await Job.find({
      $or: [
        { operarios: operatorId },
        { operario: operatorId }
      ]
    })
      .populate('cliente', 'nombre telefono direccion notas')
      .populate('clienteFacturacion', 'nombre telefono direccion')
      .populate('clienteUbicacion', 'nombre telefono direccion')
      .populate('operario', 'nombre especialidad')
      .populate('operarios', 'nombre especialidad')
      .sort({ fecha: 1 });

    const filteredJobs = operatorJobs.map(job => applyPdfRoleFilter(job, userRole));
    res.json(filteredJobs);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener los trabajos del operario', 
      error: error.message 
    });
  }
};

// Obtener un trabajo por ID
const getJobById = async (req, res) => {
  try {
    const userRole = req.user?.rol || 'operario';
    const job = await Job.findById(req.params.id)
      .populate('cliente')
      .populate('clienteFacturacion')
      .populate('clienteUbicacion')
      .populate('operario')
      .populate('operarios');

    if (!job) {
      return res.status(404).json({ message: 'Orden de trabajo no encontrada' });
    }

    const filteredJob = applyPdfRoleFilter(job, userRole);
    res.json(filteredJob);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener la orden de trabajo', 
      error: error.message 
    });
  }
};

// Actualizar una orden de trabajo existente (estado, operarios, alertas, partidas, documentos)
const updateJob = async (req, res) => {
  try {
    const userRole = req.user?.rol || 'admin';
    const { 
      alertaMaterialTexto, 
      nuevoDocumento, 
      nuevaPartida, 
      ...updateFields 
    } = req.body;

    let updateQuery = { $set: updateFields };

    // Si viene una nueva alerta de material solicitada por un operario
    if (alertaMaterialTexto) {
      updateQuery.$push = updateQuery.$push || {};
      updateQuery.$push.alertasMaterial = { texto: alertaMaterialTexto, fecha: new Date(), atendida: false };
    }

    // Si el admin sube un nuevo documento PDF
    if (nuevoDocumento && nuevoDocumento.url && nuevoDocumento.tipo && nuevoDocumento.nombre) {
      updateQuery.$push = updateQuery.$push || {};
      updateQuery.$push.documentos = nuevoDocumento;
    }

    // Si se añade una partida de presupuesto extra
    if (nuevaPartida && nuevaPartida.concepto) {
      updateQuery.$push = updateQuery.$push || {};
      updateQuery.$push.partidasPresupuesto = nuevaPartida;
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      updateQuery,
      { new: true, runValidators: true }
    )
      .populate('cliente')
      .populate('clienteFacturacion')
      .populate('clienteUbicacion')
      .populate('operario')
      .populate('operarios');

    if (!updatedJob) {
      return res.status(404).json({ message: 'Orden de trabajo no encontrada' });
    }

    const filteredJob = applyPdfRoleFilter(updatedJob, userRole);
    res.json(filteredJob);
  } catch (error) {
    res.status(400).json({ 
      message: 'Error al actualizar la orden de trabajo', 
      error: error.message 
    });
  }
};

// Crear una nueva orden de trabajo (POST) desde el formulario Frontend
const createJob = async (req, res) => {
  try {
    const newJob = new Job(req.body);
    await newJob.save();
    
    res.status(201).json({ 
      message: 'Orden de trabajo creada con éxito', 
      job: newJob 
    });
  } catch (error) {
    console.error("Error interno al guardar el trabajo:", error);
    res.status(400).json({ 
      message: 'Error al crear la orden de trabajo', 
      error: error.message 
    });
  }
};

module.exports = {
  getJobs,
  getJobsByOperator,
  getJobById,
  updateJob,
  createJob
};