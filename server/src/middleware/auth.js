
/**
 * S0-04: Authentication and authorization middleware.
 *
 * authenticate: Checks the user's login token.
 * authorize: Checks whether the user has the required role.
 * signToken: Creates a JWT for login.
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('../models/User');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * Verify the user's token and load their current role
 * from the database.
 */
async function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !/^Bearer \S+$/.test(header)) {
    return next(new AppError('UNAUTHORIZED'));
  }

  const token = header.slice(7);

  let payload;

  try {
    payload = jwt.verify(token, config.JWT_SECRET, {
      algorithms: ['HS256'],
    });
  } catch (error) {
    return next(new AppError('UNAUTHORIZED'));
  }

  if (
    !payload ||
    typeof payload.sub !== 'string' ||
    !mongoose.isValidObjectId(payload.sub) ||
    !['student', 'admin'].includes(payload.role)
  ) {
    return next(new AppError('UNAUTHORIZED'));
  }

  try {
    const user = await User.findById(payload.sub)
      .select('role name');

    if (!user) {
      return next(new AppError('UNAUTHORIZED'));
    }

    req.user = {
      id: String(user._id),
      role: user.role,
      name: user.name,
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

/**
 * Restrict access to specific user roles.
 *
 * Example:
 * authorize('admin')
 */
function authorize(...roles) {
  return function (req, res, next) {
    if (!req.user) {
      return next(new AppError('UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Authorization denied', {
        userId: req.user.id,
        path: req.path,
      });

      const code = roles.includes('admin')
        ? 'FORBIDDEN_ADMIN_ONLY'
        : 'FORBIDDEN';

      return next(new AppError(code));
    }

    return next();
  };
}

/**
 * Create a JWT for the given user.
 */
function signToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
    },
    config.JWT_SECRET,
    {
      expiresIn: Number(config.JWT_EXPIRES_IN) || 3600,
    }
  );
}

module.exports = {
  authenticate,
  authorize,
  signToken,
};
