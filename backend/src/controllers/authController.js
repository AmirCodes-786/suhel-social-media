import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import config from '../config/index.js';
import { populateUserCounts } from '../utils/formatters.js';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export const register = async (req, res, next) => {
  try {
    const { email, username, password, first_name, last_name } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        error: 'Email, username, and password are required.',
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check existing
    const existingUser = await User.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }],
    });

    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        return res.status(400).json({ error: 'Email already registered.' });
      }
      return res.status(400).json({ error: 'Username already taken.' });
    }

    const user = await User.create({
      email: cleanEmail,
      username: cleanUsername,
      password,
      first_name: first_name || '',
      last_name: last_name || '',
    });

    const profile = await Profile.create({
      user: user._id,
    });
    user.profile = profile;

    const token = generateToken(user._id);
    const formattedUser = await populateUserCounts(user, user._id);

    return res.status(201).json({
      user: formattedUser,
      token,
      access_token: token,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select('+password').populate('profile');

    if (!user) {
      return res.status(400).json({
        error: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        error: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id);
    const formattedUser = await populateUserCounts(user, user._id);

    return res.json({
      user: formattedUser,
      token,
      access_token: token,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await populateUserCounts(req.user, req.userId);
    return res.json(user);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  return res.json({
    success: true,
    message: 'Logged out successfully.',
  });
};

export default {
  register,
  login,
  getMe,
  logout,
};
