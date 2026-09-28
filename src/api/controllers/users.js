const User = require('../models/User');

// Obtener todos los usuarios (opcionalmente filtrando por rol, ej: ?rol=operario)
const getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.rol) {
      filter.rol = req.query.rol;
    }
    const users = await User.find(filter).select('-password').sort({ nombre: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener la lista de usuarios', 
      error: error.message 
    });
  }
};

// Crear un nuevo usuario (admin u operario)
const createUser = async (req, res) => {
  try {
    const { nombre, password, rol } = req.body;

    if (!nombre || !password) {
      return res.status(400).json({ message: 'Nombre y contraseña son obligatorios' });
    }

    const newUser = new User({
      nombre: nombre.trim(),
      password,
      rol: rol || 'operario'
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      message: 'Usuario creado con éxito',
      user: {
        _id: savedUser._id,
        nombre: savedUser.nombre,
        rol: savedUser.rol,
        createdAt: savedUser.createdAt
      }
    });
  } catch (error) {
    res.status(400).json({
      message: 'Error al registrar el usuario',
      error: error.message
    });
  }
};

// Actualizar un usuario existente
const updateUser = async (req, res) => {
  try {
    const { nombre, password, rol } = req.body;

    const updates = {};
    if (nombre) updates.nombre = nombre.trim();
    if (password) updates.password = password;
    if (rol) updates.rol = rol;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ 
      message: 'Error al actualizar el usuario', 
      error: error.message 
    });
  }
};

// Eliminar un usuario por ID
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado con éxito', user: deletedUser });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al eliminar el usuario', 
      error: error.message 
    });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser
};
