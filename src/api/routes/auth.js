const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateSign } = require('../../utils/jwt');

// URL: /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { nombre, password } = req.body;

  // Limpiamos los espacios y pasamos a minúsculas lo que ha escrito el operario
    let nombreFormulario = nombre.trim().toLowerCase();

    // funcion para que en el login no sea sensible a los acentos
    // .normalize("NFD") separa los caracteres de sus acentos, y el .replace elimina los acentos.
    nombreFormulario = nombreFormulario.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Buscar en la base de datos de manera inteligente
    // Traemos todos los usuarios para buscar al que coincida al limpiarle también los acentos
    const usuarios = await User.find({});
    
    const user = usuarios.find(u => {
      const nombreBD = u.nombre.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return nombreBD === nombreFormulario;
    });

    // Comprobamos contraseña
    if (user.password !== password) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Generamos el Token con tu utilidad de JWT
    const token = generateSign(user._id, user.email);

    // Devolvemos los datos y la llave al frontend
    return res.json({
      message: 'Inicio de sesión exitoso',
      token: token,
      user: {
        _id: user._id, //ponemos _id para que coincida con mongo que está puesto de esa manera
        nombre: user.nombre,
        rol: user.rol 
      }
    });

  } catch (error) {
    return res.status(500).json({ message: 'Error en el servidor' });
  }
});

module.exports = router;