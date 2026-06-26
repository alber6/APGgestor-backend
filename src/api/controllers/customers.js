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

// Crear un nuevo cliente (Calcula el id_cliente automáticamente en el servidor)
const createCustomer = async (req, res) => {
  try {
    const lastCustomer = await Customer.findOne().sort({ id_cliente: -1 });
    const nextId = lastCustomer ? lastCustomer.id_cliente + 1 : 1;

    const newCustomer = new Customer({
      id_cliente: nextId,
      nombre: req.body.nombre,
      telefono: req.body.telefono,
      email: req.body.email,
      direccion: req.body.direccion,
      tipo_vivienda: req.body.tipo_vivienda
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

// Exportación unificada en un objeto
module.exports = {
  getCustomers,
  createCustomer
};