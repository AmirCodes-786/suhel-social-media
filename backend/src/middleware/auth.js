import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

/**
 * Securely verify a Supabase JWT token.
 * NEVER falls back to jwt.decode() — signature MUST be verified.
 * Returns decoded payload or null.
 */
const verifySupabaseToken = (token) => {
  if (!config.supabase.jwtSecret) {
    // No Supabase JWT secret configured — cannot verify Supabase tokens
    return null;
  }

  try {
    const decoded = jwt.verify(token, config.supabase.jwtSecret, {
      // Supabase tokens use HS256 by default
      algorithms: ['HS256'],
    });

    // Validate expected claims
    if (!decoded.sub) return null;
    if (decoded.aud !== 'authenticated' && decoded.role !== 'authenticated') return null;

    return decoded;
  } catch {
    // Signature verification failed — token is invalid or expired
    return null;
  }
};

/**
 * Resolve a MongoDB user from a verified Supabase token payload.
 * Auto-creates user + profile if first time (mirrors Django SupabaseAuthentication).
 */
const resolveSupabaseUser = async (decoded) => {
  const supabaseUid = decoded.sub;
  const email = decoded.email || decoded.user_metadata?.email;
  const meta = decoded.user_metadata || {};

  // Look up user by supabase UID or email
  let user = await User.findById(supabaseUid).populate('profile');
  if (!user && email) {
    user = await User.findOne({ email }).populate('profile');
  }

  // Auto-sync user if not in database yet
  if (!user) {
    let username = meta.user_name || meta.username || meta.preferred_username || meta.name;
    if (!username && email) {
      username = email.split('@')[0];
    }
    if (!username) {
      username = `user_${supabaseUid.slice(0, 8)}`;
    }

    // Clean username
    username = username.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

    // Ensure unique username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      username = `${username}_${supabaseUid.slice(0, 4)}`;
    }

    user = await User.create({
      _id: supabaseUid,
      username,
      email: email || `${username}@vibehub.user`,
      first_name: meta.full_name?.split(' ')[0] || meta.name?.split(' ')[0] || '',
      last_name: meta.full_name?.split(' ').slice(1).join(' ') || meta.name?.split(' ').slice(1).join(' ') || '',
    });

    const profile = await Profile.create({
      user: user._id,
      profile_picture: meta.avatar_url || meta.picture || null,
    });
    user.profile = profile;
  } else if (!user.profile) {
    const profile = await Profile.create({ user: user._id });
    user.profile = profile;
  }

  return user;
};

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        detail: 'Authentication credentials were not provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    let user = null;

    // 1. Attempt verification with native JWT secret
    try {
      const decodedNative = jwt.verify(token, config.jwt.secret);
      if (decodedNative?.id) {
        user = await User.findById(decodedNative.id).populate('profile');
      }
    } catch {
      // Native JWT verification failed, proceed to Supabase check
    }

    // 2. Attempt SECURE verification with Supabase JWT secret
    //    NEVER uses jwt.decode() — signature MUST be cryptographically verified
    if (!user) {
      const decodedSupabase = verifySupabaseToken(token);

      if (decodedSupabase) {
        user = await resolveSupabaseUser(decodedSupabase);
      }
    }

    if (!user) {
      return res.status(401).json({
        detail: 'Given token not valid for any token type.',
      });
    }

    req.user = user;
    req.userId = (user._id || user.id).toString();
    next();
  } catch (error) {
    console.error('[AuthMiddleware] Error in authentication:', error);
    return res.status(401).json({
      detail: 'Authentication failed.',
      error: error.message,
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      req.userId = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    let user = null;

    // 1. Native JWT
    try {
      const decodedNative = jwt.verify(token, config.jwt.secret);
      if (decodedNative?.id) {
        user = await User.findById(decodedNative.id).populate('profile');
      }
    } catch {
      // Ignore
    }

    // 2. Supabase JWT (secure verification only)
    if (!user) {
      const decodedSupabase = verifySupabaseToken(token);
      if (decodedSupabase?.sub) {
        user = await User.findById(decodedSupabase.sub).populate('profile');
        if (!user && decodedSupabase.email) {
          user = await User.findOne({ email: decodedSupabase.email }).populate('profile');
        }
      }
    }

    req.user = user || null;
    req.userId = user ? (user._id || user.id).toString() : null;
    next();
  } catch {
    req.user = null;
    req.userId = null;
    next();
  }
};

export default {
  authenticate,
  optionalAuth,
};
