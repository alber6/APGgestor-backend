const express = require('express');
const router = express.Router();
const { isAuth } = require('../../middlewares/isAuth');
const {
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  updateLeaveRequestStatus,
  cancelLeaveRequest
} = require('../controllers/leaveRequests');

// Rutas para cualquier usuario autenticado (operarios y admin)
router.post('/', isAuth(), createLeaveRequest);
router.get('/mis-solicitudes', isAuth(), getMyLeaveRequests);
router.delete('/:id', isAuth(), cancelLeaveRequest);

// Rutas de administración
router.get('/', isAuth(['admin']), getAllLeaveRequests);
router.patch('/:id/estado', isAuth(['admin']), updateLeaveRequestStatus);

module.exports = router;
