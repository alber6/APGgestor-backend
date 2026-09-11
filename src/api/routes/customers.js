const express = require('express');
const router = express.Router();
const customers = require('../controllers/customers');
const { isAuth } = require('../../middlewares/isAuth');

router.get('/', customers.getCustomers);
router.post('/', isAuth(['admin']), customers.createCustomer);
router.patch('/:id', isAuth(['admin']), customers.updateCustomer);
router.put('/:id', isAuth(['admin']), customers.updateCustomer);
router.delete('/:id', isAuth(['admin']), customers.deleteCustomer);

module.exports = router;