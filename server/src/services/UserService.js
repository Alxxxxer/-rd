const UserRepository = require('../repositories/UserRepository');
const ActivityLogRepository = require('../repositories/ActivityLogRepository');
const AppError = require('../utils/errors');
const { ROLES, USER_STATUS } = require('../constants');
const logger = require('../utils/logger');

class UserService {
  async getAllUsers(filters = {}, options = {}) {
    const queryFilter = {};

    // 1. Build search filters
    if (filters.search) {
      queryFilter.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (filters.role) {
      queryFilter.role = filters.role;
    }

    if (filters.status) {
      queryFilter.status = filters.status;
    }

    // 2. Query Repository
    return await UserRepository.findAll(queryFilter, options);
  }

  async createUser(adminUser, newUserData) {
    const { name, email, password, role } = newUserData;

    // 1. Enforce Role Hierarchy to prevent privilege escalation
    if (adminUser.role === ROLES.ADMIN) {
      if (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN) {
        throw new AppError('Forbidden: Admins cannot create Super Admin or Admin accounts.', 403);
      }
    }

    // 2. Check if email already registered
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email address is already in use.', 400);
    }

    // 3. Create User in Database
    const user = await UserRepository.create({
      name,
      email,
      password, // Will be hashed automatically by pre-save schema hook
      role,
      status: USER_STATUS.ACTIVE
    });

    // 4. Log management audit trail
    await ActivityLogRepository.create({
      user: adminUser.id,
      action: 'USER_CREATE',
      details: {
        targetUserId: user._id,
        targetEmail: user.email,
        assignedRole: user.role
      }
    });

    logger.info(`User created successfully by ${adminUser.email}: ${user.email} (${user.role})`);

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt
    };
  }

  async updateUser(adminUser, targetUserId, updateData) {
    // 1. Find target user
    const targetUser = await UserRepository.findById(targetUserId);
    if (!targetUser) {
      throw new AppError('User not found.', 404);
    }

    // 2. Block self-deactivation and self-role modifications
    const isSelfAction = adminUser.id.toString() === targetUser._id.toString();
    if (isSelfAction) {
      if (updateData.status === USER_STATUS.DEACTIVATED) {
        throw new AppError('Conflict: You cannot deactivate your own account.', 400);
      }
      if (updateData.role && updateData.role !== targetUser.role) {
        throw new AppError('Conflict: You cannot change your own permission role.', 400);
      }
    }

    // 3. Enforce Hierarchical Security Access rules
    if (adminUser.role === ROLES.ADMIN) {
      // Admins cannot modify Super Admins
      if (targetUser.role === ROLES.SUPER_ADMIN) {
        throw new AppError('Forbidden: Admins cannot modify Super Admin accounts.', 403);
      }
      // Admins cannot modify other Admins
      if (targetUser.role === ROLES.ADMIN && !isSelfAction) {
        throw new AppError('Forbidden: Admins cannot modify other Admin accounts.', 403);
      }
      // Admins cannot assign Admin or Super Admin roles
      if (updateData.role === ROLES.SUPER_ADMIN || updateData.role === ROLES.ADMIN) {
        throw new AppError('Forbidden: Admins cannot grant Admin or Super Admin status.', 403);
      }
    }

    // 4. Perform Update
    const updatedFields = {};
    if (updateData.name !== undefined) updatedFields.name = updateData.name;
    if (updateData.role !== undefined) updatedFields.role = updateData.role;
    if (updateData.status !== undefined) updatedFields.status = updateData.status;

    const updatedUser = await UserRepository.update(targetUserId, updatedFields);

    // 5. Log change audit trail
    await ActivityLogRepository.create({
      user: adminUser.id,
      action: 'USER_UPDATE',
      details: {
        targetUserId: updatedUser._id,
        targetEmail: updatedUser.email,
        updatedFields
      }
    });

    logger.info(`User updated successfully by ${adminUser.email}: ${updatedUser.email}`);

    return {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      updatedAt: updatedUser.updatedAt
    };
  }

  async getActivityLogs(filters = {}, options = {}) {
    const queryFilter = {};

    if (filters.action) {
      queryFilter.action = filters.action;
    }

    if (filters.userId) {
      queryFilter.user = filters.userId;
    }

    return await ActivityLogRepository.findAll(queryFilter, options);
  }
}

module.exports = new UserService();
