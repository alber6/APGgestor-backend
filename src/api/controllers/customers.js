const Customer = require('../models/Customer');
const Job = require('../models/Job');

// Obtener todos los clientes con conteo dinámico de obras activas (Ordenados alfabéticamente)
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ nombre: 1 }).lean();

    const customersConObras = await Promise.all(
      customers.map(async (cliente) => {
        const obrasAsociadas = await Job.countDocuments({
          $or: [
            { cliente: cliente._id },
            { clienteFacturacion: cliente._id },
            { clienteUbicacion: cliente._id }
          ],
          estado: { $nin: ['Finalizado', 'Completado', 'Cancelado'] }
        });

        return {
          ...cliente,
          obras_asociadas: obrasAsociadas,
          tiene_obra_activa: obrasAsociadas > 0
        };
      })
    );

    res.json(customersConObras);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener los clientes', 
      error: error.message 
    });
  }
};

// Crear un nuevo cliente
const createCustomer = async (req, res) => {
  try {
    let nextId = req.body.id_cliente;
    if (!nextId) {
      const lastCustomer = await Customer.findOne().sort({ id_cliente: -1 });
      nextId = lastCustomer ? lastCustomer.id_cliente + 1 : 101;
    }

    const dirCalculada = `${req.body.tipo_via || 'CALLE'} ${req.body.nombre_via || ''} ${req.body.numero || ''}`.trim();

    const newCustomer = new Customer({
      id_cliente: nextId,
      nif: req.body.nif,
      nombre: req.body.nombre,
      nombre_referencia: req.body.nombre_referencia || '',
      apellido1: req.body.apellido1 || '',
      apellido2: req.body.apellido2 || '',
      telefono: req.body.telefono || '',
      email: req.body.email || '',
      tipo_via: req.body.tipo_via || 'CALLE',
      nombre_via: req.body.nombre_via || '',
      numero: req.body.numero || '',
      bloque: req.body.bloque || '',
      portal: req.body.portal || '',
      escalera: req.body.escalera || '',
      piso: req.body.piso || '',
      puerta: req.body.puerta || '',
      direccion_fiscal: req.body.direccion_fiscal || dirCalculada,
      localidad: req.body.localidad || '',
      provincia: req.body.provincia || '',
      cp: req.body.cp || '',
      direccion: req.body.direccion || req.body.direccion_fiscal || dirCalculada,
      tipo_vivienda: req.body.tipo_vivienda || 'Chalet',
      es_empresa: Boolean(req.body.es_empresa),
      representante_nombre: req.body.representante_nombre || '',
      representante_apellido1: req.body.representante_apellido1 || '',
      representante_apellido2: req.body.representante_apellido2 || '',
      representante_nif: req.body.representante_nif || '',
      rep_correo: req.body.rep_correo || '',
      rep_tipo_via: req.body.rep_tipo_via || 'CALLE',
      rep_nombre_via: req.body.rep_nombre_via || '',
      rep_numero: req.body.rep_numero || '',
      rep_bloque: req.body.rep_bloque || '',
      rep_portal: req.body.rep_portal || '',
      rep_escalera: req.body.rep_escalera || '',
      rep_piso: req.body.rep_piso || '',
      rep_puerta: req.body.rep_puerta || '',
      rep_localidad: req.body.rep_localidad || '',
      rep_provincia: req.body.rep_provincia || '',
      rep_cp: req.body.rep_cp || '',
      rep_tel_fijo: req.body.rep_tel_fijo || '',
      rep_tel_movil: req.body.rep_tel_movil || ''
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
    const payload = { ...req.body };
    if (payload.tipo_via || payload.nombre_via || payload.numero) {
      const dirCalc = `${payload.tipo_via || 'CALLE'} ${payload.nombre_via || ''} ${payload.numero || ''}`.trim();
      payload.direccion_fiscal = payload.direccion_fiscal || dirCalc;
      payload.direccion = payload.direccion || dirCalc;
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );
    
    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Recalcular conteo de obras activas para no perder el estado dinámico al actualizar
    const obrasAsociadas = await Job.countDocuments({
      $or: [
        { cliente: updatedCustomer._id },
        { clienteFacturacion: updatedCustomer._id },
        { clienteUbicacion: updatedCustomer._id }
      ],
      estado: { $nin: ['Finalizado', 'Completado', 'Cancelado'] }
    });

    const customerObj = updatedCustomer.toObject();
    customerObj.obras_asociadas = obrasAsociadas;
    customerObj.tiene_obra_activa = obrasAsociadas > 0;

    res.json(customerObj);
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

module.exports = {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
};