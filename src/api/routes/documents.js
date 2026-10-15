const express = require('express');
const router = express.Router();
const { generateJobDocument, generateMemoriaPDF } = require('../controllers/documents');

// POST /api/jobs/:id/generate-docs → Genera la Solicitud en formato Word (.docx)
router.post('/:id/generate-docs', generateJobDocument);

// GET /api/jobs/:id/generate-memoria → Genera la Memoria Técnica oficial en PDF
router.get('/:id/generate-memoria', generateMemoriaPDF);

module.exports = router;
