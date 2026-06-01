const Joi = require('joi');
const AppError = require('../utils/errors');

/**
 * Validates request body, query, or params against a Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {string} source - Request field to validate ('body', 'query', 'params')
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false, // Return all validation errors, not just the first one
      allowUnknown: false, // Disallow fields not defined in the schema
      stripUnknown: true // Strip fields not defined in the schema
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message).join(', ');
      return next(new AppError(`Validation failed: ${errorMessages}`, 400));
    }

    // Replace request payload with validated, sanitized values
    req[source] = value;
    next();
  };
};

// Define standard Joi schemas for authentication
const schemas = {
  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .lowercase()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  forgotPassword: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .lowercase()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      })
  }),

  resetPassword: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'Reset token is required'
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required'
      })
  }),

  // Schema for admin creating/updating a user
  userCreate: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required().lowercase(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE').required()
  }),

  userUpdate: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    role: Joi.string().valid('ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE').optional(),
    status: Joi.string().valid('ACTIVE', 'DEACTIVATED').optional()
  }),

  leadCreate: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().allow('').optional().lowercase(),
    phone: Joi.string().allow('').optional(),
    source: Joi.string().allow('').optional(),
    status: Joi.string().valid('NEW', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'LOST').optional(),
    assignedTo: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null, '').optional(),
    delegate: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null, '').optional(),
    followUpDate: Joi.date().allow(null, '').optional(),
    initialNote: Joi.string().allow('').optional()
  }),

  leadUpdate: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().allow('').optional().lowercase(),
    phone: Joi.string().allow('').optional(),
    source: Joi.string().allow('').optional(),
    status: Joi.string().valid('NEW', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'LOST').optional(),
    assignedTo: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null, '').optional(),
    delegate: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null, '').optional(),
    followUpDate: Joi.date().allow(null, '').optional()
  }),

  delegateCreate: Joi.object({
    userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
      'any.required': 'Target user ID reference is required',
      'string.pattern.base': 'Invalid target user ID reference'
    }),
    campus: Joi.string().min(2).max(100).required().messages({
      'any.required': 'Campus name is required'
    }),
    code: Joi.string().min(2).max(30).required().messages({
      'any.required': 'Unique delegate code is required'
    })
  }),

  delegateUpdate: Joi.object({
    campus: Joi.string().min(2).max(100).optional(),
    code: Joi.string().min(2).max(30).optional()
  })
};

module.exports = {
  validate,
  schemas
};
