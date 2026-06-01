const express = require('express');
const LeadController = require('../controllers/LeadController');
const { protect } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validationMiddleware');

const router = express.Router();

// Secure all endpoints below with authentication
router.use(protect);

router.route('/')
  .get(LeadController.getAllLeads)
  .post(validate(schemas.leadCreate), LeadController.createLead);

router.route('/:id')
  .patch(validate(schemas.leadUpdate), LeadController.updateLead)
  .delete(LeadController.deleteLead);

// Endpoint to append structured comments to a lead notes history
router.post('/:id/notes', LeadController.addLeadNote);

module.exports = router;
