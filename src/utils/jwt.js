import logger from '#config/logger.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = '1d';

export const jwttoken = {
  sign: payload => {
    try {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
    } catch (error) {
      logger.error('Error signing JWT:', error);
      throw new Error('Failed to sign JWT');
    }
  },
  verify: token => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (e) {
      logger.error('Error verifying JWT:', e);
      throw new Error('Invalid or expired JWT');
    }
  },
};
