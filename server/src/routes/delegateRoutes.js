const express = require('express');
const DelegateController = require('../controllers/DelegateController');
const { protect } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validationMiddleware');

const router = express.Router();

// Secure all endpoints below with authentication
router.use(protect);

// The Leaderboard route is defined BEFORE parametric routes /:id to prevent Express routing conflicts
router.get('/leaderboard', DelegateController.getLeaderboard);

router.route('/')
  .get(DelegateController.getAllDelegates)
  .post(validate(schemas.delegateCreate), DelegateController.createDelegate);

router.route('/:id')
  .patch(validate(schemas.delegateUpdate), DelegateController.updateDelegate);

module.exports = router;
