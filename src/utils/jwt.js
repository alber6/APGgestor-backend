const jwt = require('jsonwebtoken');

// Genera el token cuando el usuario hace login con éxito
const generateSign = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Verifica si el token es válido (usado por tu middleware isAuth)
const verifyJwt = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateSign, verifyJwt };