const DelegateService = require('../services/DelegateService');

class DelegateController {
  async getAllDelegates(req, res, next) {
    try {
      const { search, page = 1, limit = 10 } = req.query;

      const filters = { search };
      const options = { page, limit };

      const result = await DelegateService.getAllDelegates(filters, options);

      res.status(200).json({
        success: true,
        data: result.delegates,
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

  async createDelegate(req, res, next) {
    try {
      const adminUser = req.user;
      const delegate = await DelegateService.createDelegate(adminUser, req.body);

      res.status(201).json({
        success: true,
        message: 'Delegate profile created successfully.',
        data: delegate
      });
    } catch (error) {
      next(error);
    }
  }

  async updateDelegate(req, res, next) {
    try {
      const { id } = req.params;
      const adminUser = req.user;

      const delegate = await DelegateService.updateDelegate(adminUser, id, req.body);

      res.status(200).json({
        success: true,
        message: 'Delegate profile updated successfully.',
        data: delegate
      });
    } catch (error) {
      next(error);
    }
  }

  async getLeaderboard(req, res, next) {
    try {
      const leaderboard = await DelegateService.getLeaderboard();

      res.status(200).json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DelegateController();
