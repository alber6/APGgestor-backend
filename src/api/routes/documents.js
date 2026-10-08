const express = require('express');
const router = express.Router();
const { generateJobDocument } = require('../controllers/documents');

// Endpoint POST /api/jobs/:id/generate-docs
router.post('/:id/generate-docs', generateJobDocument);

module.exports = router;
