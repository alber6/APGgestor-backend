const Job = require('../models/Job');

// Obtener todos los trabajos (Populate) para el Dashboard de la oficina
const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('cliente', 'nombre telefono direccion tipo_vivienda')
      .populate('operario', 'nombre especialidad')
      .sort({ fecha: -1 });
      
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener las órdenes de trabajo', 
      error: error.message 
    });
  }
};

// Obtener trabajos de un operario específico (Para su vista móvil)
const getJobsByOperator = async (req, res) => {
  try {
    const operatorJobs = await Job.find({ operario: req.params.operatorId })
      .populate('cliente', 'nombre telefono direccion notas')
      .sort({ fecha: 1 });
      
    res.json(operatorJobs);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener los trabajos del operario', 
      error: error.message 
    });
  }
};

// Actualizar una orden de trabajo existente (Cambiar estado, etc.)
const updateJob = async (req, res) => {
  try {
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('cliente').populate('operario');

    if (!updatedJob) {
      return res.status(404).json({ message: 'Orden de trabajo no encontrada' });
    }
    res.json(updatedJob);
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
    // Creamos la instancia del modelo con los datos del formulario (req.body)
    const newJob = new Job(req.body);
    
    // Lo guardamos de forma asíncrona en MongoDB Atlas
    await newJob.save();
    
    // Respondemos con código 201 (Creado correctamente)
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

// Agrupamos todas las funciones en un único objeto exportable
module.exports = {
  getJobs,
  getJobsByOperator,
  updateJob,
  createJob
};