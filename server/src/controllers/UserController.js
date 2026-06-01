const UserService = require('../services/UserService');

class UserController {
  async getAllUsers(req, res, next) {
    try {
      const { search, role, status, page = 1, limit = 10 } = req.query;

      const filters = { search, role, status };
      const options = { page, limit };

      const result = await UserService.getAllUsers(filters, options);

      res.status(200).json({
        success: true,
        data: result.users,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit: Number(limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const { name, email, password, role } = req.body;
      const adminUser = req.user;

      const result = await UserService.createUser(adminUser, {
        name,
        email,
        password,
        role
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully.',
        user: result
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { name, role, status } = req.body;
      const adminUser = req.user;

      const result = await UserService.updateUser(adminUser, id, {
        name,
        role,
        status
      });

      res.status(200).json({
        success: true,
        message: 'User updated successfully.',
        user: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getActivityLogs(req, res, next) {
    try {
      const { action, userId, page = 1, limit = 20 } = req.query;

      const filters = { action, userId };
      const options = { page, limit };

      const result = await UserService.getActivityLogs(filters, options);

      res.status(200).json({
        success: true,
        data: result.logs,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit: Number(limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
