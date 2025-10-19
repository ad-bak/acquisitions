import aj from '#config/arcjet.js';
import logger from '#config/logger.js';
import { slidingWindow } from '@arcjet/node';

const securityMiddleware = async (req, res, next) => {
  try {
    const role = req.user?.role || 'guest';

    let limit;
    let message;

    switch (role) {
      case 'admin':
        limit = 20;
        message = 'Admin request limit exceeded (20 per minute). Slow down.';
        break;
      case 'user':
        limit = 10;
        message = 'User request limit exceeded 10 per minute. Slow down';
        break;
      case 'guest':
        limit = 5;
        message = 'Guest request limit exceeded (5 per minute). Slow down.';
        break;
    }

    const client = aj.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: limit,
      })
    );

    const decision = await client.protect(req);

    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn('Bot request blocked', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Automated requests are not allowed !',
      });
    }

    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        role,
        path: req.path,
      });

      return res.status(429).json({
        error: 'Too Many Requests',
        message,
      });
    }

    next();
  } catch (error) {
    logger.error('Arcjet middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Something went wrong with security middleware.',
    });
  }
};

export default securityMiddleware;
