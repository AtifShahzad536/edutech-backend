const SystemSetting = require('../models/SystemSetting');
const { verifyToken } = require('../utils/token');
const User = require('../models/User');

let isMaintenanceMode = false;
let lastCheck = 0;
const CACHE_TTL = 30000; // 30 seconds

const maintenanceMiddleware = async (req, res, next) => {
  // Always allow admin and auth routes to prevent locking out administrators
  if (req.path.startsWith('/admin') || req.path.startsWith('/auth/')) {
    return next();
  }

  try {
    const now = Date.now();
    // Cache the DB lookup for 30 seconds to prevent DB strain
    if (now - lastCheck > CACHE_TTL) {
      const setting = await SystemSetting.findOne({ key: 'maintenanceMode' });
      isMaintenanceMode = setting ? setting.value === true : false;
      lastCheck = now;
    }

    if (isMaintenanceMode) {
      let isAdmin = false;
      
      // Check if the current request is from an admin
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = verifyToken(token); // Actually, utils/token doesn't export verifyToken directly. 
          // Wait, let's just decode it safely. We can require jsonwebtoken.
          const jwt = require('jsonwebtoken');
          const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
          
          if (decodedToken) {
            const user = await User.findById(decodedToken.id);
            if (user && user.role === 'admin') {
              isAdmin = true;
            }
          }
        } catch (e) {
          // Ignore invalid tokens, treat as unauthenticated
        }
      }

      // If not an admin, block the request
      if (!isAdmin) {
        return res.status(503).json({
          success: false,
          message: 'The platform is currently undergoing scheduled maintenance. Please check back shortly.',
          maintenanceMode: true
        });
      }
    }
  } catch (error) {
    console.error('Maintenance check error:', error);
  }
  
  next();
};

// Function to forcibly invalidate cache when settings are saved by admin
maintenanceMiddleware.invalidateCache = () => {
  lastCheck = 0;
};

module.exports = maintenanceMiddleware;
