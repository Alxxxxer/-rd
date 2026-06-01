const express = require('express');
const UserController = require('../controllers/UserController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/rbacMiddleware');
const { validate, schemas } = require('../middlewares/validationMiddleware');
const { ROLES } = require('../constants');

const router = express.Router();

// Secure all endpoints below with authentication and RBAC checks
router.use(protect);
router.use(restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN));

router.route('/')
  .get(UserController.getAllUsers)
  .post(validate(schemas.userCreate), UserController.createUser);

// Make sure that the activity-logs route is defined BEFORE the parameter route /:id
// to avoid Express matching "activity-logs" as a param ID! This is a classic clean architecture design note.
router.get('/activity-logs', UserController.getActivityLogs);

router.route('/:id')
  .patch(validate(schemas.userUpdate), UserController.updateUser);

module.exports = router;
