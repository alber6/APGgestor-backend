const Operator = require('../models/Operator');
const User = require('../models/User');

// Obtener todos los operarios
const getOperators = async (req, res) => {
  try {
    const operators = await Operator.find().sort({ id_operario: 1 });
    res.json(operators);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener la lista de operarios', 
      error: error.message 
    });
  }
};

// Crear un nuevo operario y sus credenciales de acceso (User)
const createOperator = async (req, res) => {
  try {
    const { nombre, especialidad, disponibilidad, password, id_operario } = req.body;

    let nextId = id_operario;
    if (!nextId) {
      const lastOp = await Operator.findOne().sort({ id_operario: -1 });
      nextId = lastOp ? lastOp.id_operario + 1 : 101;
    }

    const newOperator = new Operator({
      id_operario: nextId,
      nombre,
      especialidad: especialidad || 'Electricidad General',
      disponibilidad: disponibilidad !== undefined ? disponibilidad : true
    });

    const savedOperator = await newOperator.save();

    // Crear cuenta de usuario asociada para que el operario pueda hacer login
    const newUser = new User({
      nombre: savedOperator.nombre,
      password: password || '1234',
      rol: 'operario',
      operarioId: savedOperator._id
    });
    await newUser.save();

    res.status(201).json({
      message: 'Operario y credenciales creados con éxito',
      operator: savedOperator,
      user: { nombre: newUser.nombre, rol: newUser.rol }
    });
  } catch (error) {
    res.status(400).json({
      message: 'Error al registrar el operario',
      error: error.message
    });
  }
};

// Actualizar datos de un operario (y opcionalmente su contraseña en User)
const updateOperator = async (req, res) => {
  try {
    const { nombre, especialidad, disponibilidad, password } = req.body;

    const updatedOperator = await Operator.findByIdAndUpdate(
      req.params.id,
      { nombre, especialidad, disponibilidad },
      { new: true, runValidators: true }
    );
    
    if (!updatedOperator) {
      return res.status(404).json({ message: 'Operario no encontrado' });
    }

    // Si se modificó el nombre o la contraseña, actualizar el modelo User
    const userUpdates = {};
    if (nombre) userUpdates.nombre = nombre;
    if (password) userUpdates.password = password;

    if (Object.keys(userUpdates).length > 0) {
      await User.findOneAndUpdate(
        { $or: [{ operarioId: updatedOperator._id }, { nombre: updatedOperator.nombre }] },
        { $set: userUpdates }
      );
    }

    res.json(updatedOperator);
  } catch (error) {
    res.status(400).json({ 
      message: 'Error al actualizar el operario', 
      error: error.message 
    });
  }
};

// Modificar únicamente disponibilidad de un operario (Función rápida)
const updateAvailability = async (req, res) => {
  try {
    const updatedOperator = await Operator.findByIdAndUpdate(
      req.params.id, 
      { disponibilidad: req.body.disponibilidad },
      { new: true }
    );
    
    if (!updatedOperator) {
      return res.status(404).json({ message: 'Operario no encontrado' });
    }
    res.json(updatedOperator);
  } catch (error) {
    res.status(400).json({ 
      message: 'Error al actualizar la disponibilidad', 
      error: error.message 
    });
  }
};

// Eliminar un operario y su cuenta de usuario vinculada
const deleteOperator = async (req, res) => {
  try {
    const deletedOperator = await Operator.findByIdAndDelete(req.params.id);
    if (!deletedOperator) {
      return res.status(404).json({ message: 'Operario no encontrado' });
    }

    // Eliminar también la cuenta de usuario vinculada
    await User.deleteMany({
      $or: [
        { operarioId: deletedOperator._id },
        { nombre: deletedOperator.nombre }
      ]
    });

    res.json({ message: 'Operario y credenciales eliminados con éxito', operator: deletedOperator });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al eliminar el operario', 
      error: error.message 
    });
  }
};

module.exports = {
  getOperators,
  createOperator,
  updateOperator,
  updateAvailability,
  deleteOperator
};