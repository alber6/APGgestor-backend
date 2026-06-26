const express = require('express');
const router = express.Router();
const jobs = require('../controllers/jobs');

router.get('/', jobs.getJobs);
router.get('/operator/:operatorId', jobs.getJobsByOperator);
router.patch('/:id', jobs.updateJob);
router.post('/', jobs.createJob);

module.exports = router;