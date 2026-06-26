const express = require('express');
const router = express.Router();
const customers = require('../controllers/customers');

router.get('/', customers.getCustomers);
router.post('/', customers.createCustomer);

module.exports = router;