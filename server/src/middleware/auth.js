const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Settings = require('../models/Settings');

// Protect route (JWT verify)
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'FixMyAreaSecretKey2026SecureHashTokenJWT');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.status === 'suspended' || user.status === 'banned') {
      return res.status(403).json({ success: false, message: `Your account has been ${user.status}` });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
  }
};

// Check if user has specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user ? req.user.role : 'guest'}) is not authorized to access this resource`
      });
    }
    next();
  };
};

// Global Maintenance Mode check
const checkMaintenance = async (req, res, next) => {
  try {
    const settings = await Settings.findOne();
    
    // If maintenance mode is active
    if (settings && settings.maintenanceMode) {
      // Allow auth routes like login so admin can authenticate
      const isLoginRoute = req.originalUrl.includes('/api/auth/login');
      
      // We will perform JWT check here if headers are provided to verify if the user is an admin
      let isAdmin = false;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'FixMyAreaSecretKey2026SecureHashTokenJWT');
          const user = await User.findById(decoded.id);
          if (user && user.role === 'admin') {
            isAdmin = true;
          }
        } catch (e) {
          // Silent failure: let regular validation handle it or block as guest
        }
      }

      if (!isLoginRoute && !isAdmin) {
        return res.status(503).json({
          success: false,
          isMaintenance: true,
          message: settings.maintenanceMessage || 'FixMyArea is currently undergoing scheduled maintenance. Please try again later.'
        });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect, authorize, checkMaintenance };
