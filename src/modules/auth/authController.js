const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('./userModel');
const { AppError } = require('../../middleware/errorHandler');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

const authController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await userModel.findByEmail(email);
      if (!user) {
        throw new AppError('Invalid email or password.', 401);
      }

      if (!user.is_active) {
        throw new AppError('Account is deactivated. Contact admin.', 403);
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new AppError('Invalid email or password.', 401);
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      await userModel.updateLastLogin(user.id);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: REFRESH_COOKIE_MAX_AGE,
        path: '/',
      });

      res.json({
        success: true,
        message: 'Login successful.',
        data: {
          accessToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            avatar_url: user.avatar_url,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req, res, next) {
    try {
      const token = req.cookies.refreshToken;

      if (!token) {
        throw new AppError('No refresh token provided.', 401);
      }

      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

      const user = await userModel.findById(decoded.id);
      if (!user || !user.is_active) {
        res.clearCookie('refreshToken', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
        });
        throw new AppError('User no longer exists or is deactivated.', 403);
      }

      const accessToken = generateAccessToken(user);

      res.json({
        success: true,
        data: { accessToken },
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Refresh token expired. Please login again.',
          code: 'REFRESH_TOKEN_EXPIRED',
        });
      }
      next(error);
    }
  },

  async logout(req, res) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  },

  async getMe(req, res, next) {
    try {
      const user = await userModel.findById(req.user.id);

      if (!user) {
        throw new AppError('User not found.', 404);
      }

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;