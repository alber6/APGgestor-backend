const express = require('express');
const router = express.Router();
const operators = require('../controllers/operators');
const { isAuth } = require('../../middlewares/isAuth');

router.get('/', operators.getOperators);
router.post('/', isAuth(['admin']), operators.createOperator);
router.patch('/:id', isAuth(['admin']), operators.updateOperator);
router.put('/:id', isAuth(['admin']), operators.updateOperator);
router.delete('/:id', isAuth(['admin']), operators.deleteOperator);

module.exports = router;

