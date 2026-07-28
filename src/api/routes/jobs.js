const express = require('express');
const router = express.Router();
const jobs = require('../controllers/jobs');
const User = require('../models/User');
const { verifyJwt } = require('../../utils/jwt');

// Middleware para extraer req.user si viene un token de autorización en la petición
const attachUserIfAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.includes(" ")) {
      const [, token] = authHeader.split(" ");
      if (token) {
        const { id } = verifyJwt(token);
        const user = await User.findById(id);
        if (user) {
          user.password = null;
          req.user = user;
        }
      }
    }
  } catch (err) {
    // Si no hay token o es inválido, continúa sin req.user (el controlador aplicará por defecto el filtro de operario)
  }
  next();
};

router.get('/', attachUserIfAuth, jobs.getJobs);
router.get('/operator/:operatorId', attachUserIfAuth, jobs.getJobsByOperator);
router.get('/:id', attachUserIfAuth, jobs.getJobById);
router.patch('/:id', attachUserIfAuth, jobs.updateJob);
router.post('/', attachUserIfAuth, jobs.createJob);

module.exports = router;