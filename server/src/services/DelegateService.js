const DelegateRepository = require('../repositories/DelegateRepository');
const ActivityLogRepository = require('../repositories/ActivityLogRepository');
const UserRepository = require('../repositories/UserRepository');
const AppError = require('../utils/errors');
const { ROLES } = require('../constants');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

class DelegateService {
  async getAllDelegates(filters = {}, options = {}) {
    const queryFilter = {};

    if (filters.search) {
      queryFilter.$or = [
        { campus: { $regex: filters.search, $options: 'i' } },
        { code: { $regex: filters.search, $options: 'i' } }
      ];
    }

    return await DelegateRepository.findAll(queryFilter, options);
  }

  async createDelegate(adminUser, delegateData) {
    const { userId, campus, code } = delegateData;

    // 1. Enforce Role boundaries
    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALES_MANAGER].includes(adminUser.role)) {
      throw new AppError('Forbidden: Insufficient privileges to register delegate profiles.', 403);
    }

    // 2. Verify target user exists
    const targetUser = await UserRepository.findById(userId);
    if (!targetUser) {
      throw new AppError('The target user account does not exist.', 404);
    }

    // 3. Ensure target user doesn't already own a profile
    const existingProfile = await DelegateRepository.findByUserId(userId);
    if (existingProfile) {
      throw new AppError('This user is already linked to another delegate profile.', 400);
    }

    // 4. Create Delegate profile
    const delegate = await DelegateRepository.create({
      user: userId,
      campus,
      code: code.toUpperCase()
    });

    // Log operational audit log
    await ActivityLogRepository.create({
      user: adminUser.id,
      action: 'DELEGATE_CREATE',
      details: {
        delegateId: delegate._id,
        targetEmail: targetUser.email,
        campus: delegate.campus,
        code: delegate.code
      }
    });

    logger.info(`Delegate profile created for user ${targetUser.email} by ${adminUser.email}`);

    return delegate;
  }

  async updateDelegate(adminUser, id, updateData) {
    const { campus, code } = updateData;

    // Enforce Role boundaries
    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SALES_MANAGER].includes(adminUser.role)) {
      throw new AppError('Forbidden: Insufficient privileges to update delegate profiles.', 403);
    }

    const currentProfile = await DelegateRepository.findById(id);
    if (!currentProfile) {
      throw new AppError('Delegate profile not found.', 404);
    }

    const updatedProfile = await DelegateRepository.update(id, {
      campus: campus || currentProfile.campus,
      code: code ? code.toUpperCase() : currentProfile.code
    });

    // Log operational audit log
    await ActivityLogRepository.create({
      user: adminUser.id,
      action: 'DELEGATE_UPDATE',
      details: {
        delegateId: updatedProfile._id,
        campus: updatedProfile.campus,
        code: updatedProfile.code
      }
    });

    logger.info(`Delegate profile updated by ${adminUser.email}: ${updatedProfile.code}`);

    return updatedProfile;
  }

  async getLeaderboard() {
    return await DelegateRepository.getLeaderboard();
  }

  // Recalculates stats self-healingly based on active Lead document counts
  async syncDelegateStats(delegateId) {
    if (!delegateId) return;

    try {
      const Lead = mongoose.model('Lead');

      // Count dynamic leads
      const assigned = await Lead.countDocuments({ delegate: delegateId });
      const converted = await Lead.countDocuments({ delegate: delegateId, status: 'CONVERTED' });

      await DelegateRepository.update(delegateId, {
        assignedLeadsCount: assigned,
        convertedLeadsCount: converted
      });

      logger.debug(`Synchronized stats for delegate ${delegateId}: Assigned=${assigned}, Converted=${converted}`);
    } catch (error) {
      logger.error(`Failed to synchronize stats for delegate ${delegateId}`, error);
    }
  }
}

module.exports = new DelegateService();
