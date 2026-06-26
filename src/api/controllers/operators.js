const Operator = require('../models/Operator');

// Obtener todos los operarios
const getOperators = async (req, res) => {
  try {
    const operators = await Operator.find();
    res.json(operators);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener la lista de operarios', 
      error: error.message 
    });
  }
};

// Modificar disponibilidad de un operario
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
      message: 'Error al actualizar el estado del operario', 
      error: error.message 
    });
  }
};

// Exportación unificada en un objeto
module.exports = {
  getOperators,
  updateAvailability
};