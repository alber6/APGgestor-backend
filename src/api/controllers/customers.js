const Customer = require('../models/Customer');

// Obtener todos los clientes (Ordenados alfabéticamente)
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ nombre: 1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener los clientes', 
      error: error.message 
    });
  }
};

// Crear un nuevo cliente (Calcula el id_cliente automáticamente en el servidor si no se pasa)
const createCustomer = async (req, res) => {
  try {
    let nextId = req.body.id_cliente;
    if (!nextId) {
      const lastCustomer = await Customer.findOne().sort({ id_cliente: -1 });
      nextId = lastCustomer ? lastCustomer.id_cliente + 1 : 1;
    }

    const newCustomer = new Customer({
      id_cliente: nextId,
      nombre: req.body.nombre,
      telefono: req.body.telefono,
      email: req.body.email,
      direccion: req.body.direccion,
      tipo_vivienda: req.body.tipo_vivienda || 'Vivienda'
    });

    const savedCustomer = await newCustomer.save();
    res.status(201).json(savedCustomer);
  } catch (error) {
    res.status(400).json({ 
      message: 'Error al registrar el cliente', 
      error: error.message 
    });
  }
};

// Actualizar un cliente existente
const updateCustomer = async (req, res) => {
  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.json(updatedCustomer);
  } catch (error) {
    res.status(400).json({ 
      message: 'Error al actualizar el cliente', 
      error: error.message 
    });
  }
};

// Eliminar un cliente por ID
const deleteCustomer = async (req, res) => {
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
    if (!deletedCustomer) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.json({ message: 'Cliente eliminado con éxito', customer: deletedCustomer });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al eliminar el cliente', 
      error: error.message 
    });
  }
};

// Exportación unificada en un objeto
module.exports = {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
};