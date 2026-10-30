const express = require('express');
const router = express.Router();
const { isAuth } = require('../../middlewares/isAuth');
const {
  punch,
  getCurrentStatus,
  getMyRecords,
  getAllRecords,
  createManualRecord,
  updateRecord,
  deleteRecord,
  exportCSV,
  exportPDF
} = require('../controllers/timeRecords');

// Rutas de Operarios y Usuarios autenticados
router.post('/', isAuth(), punch);
router.get('/estado-actual', isAuth(), getCurrentStatus);
router.get('/mis-registros', isAuth(), getMyRecords);

// Rutas exclusivas del Administrador (Auditoría, Informes y Cumplimiento Legal)
router.get('/export/csv', isAuth(['admin']), exportCSV);
router.get('/export/pdf', isAuth(['admin']), exportPDF);
router.get('/', isAuth(['admin']), getAllRecords);
router.post('/manual', isAuth(['admin']), createManualRecord);
router.put('/:id', isAuth(['admin']), updateRecord);
router.delete('/:id', isAuth(['admin']), deleteRecord);

module.exports = router;
