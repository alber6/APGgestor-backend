// importar express
const express = require('express');
const router = express.Router();

//importar el controlador
const operators = require('../controllers/operators')

// Definimos las rutas y le pasamos la función del controlador
router.get('/', operators.getOperators);
router.patch('/:id', operators.updateAvailability);

module.exports = router
