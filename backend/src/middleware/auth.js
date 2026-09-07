import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

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

    // 2. Attempt verification with Supabase JWT secret if native failed
    if (!user && config.supabase.jwtSecret) {
      try {
        const decodedSupabase = jwt.verify(token, config.supabase.jwtSecret, {
          algorithms: ['HS256'],
        });

        const supabaseUid = decodedSupabase.sub;
        const email = decodedSupabase.email;
        const meta = decodedSupabase.user_metadata || {};

        if (supabaseUid) {
          // Look up user by supabase UID or email
          user = await User.findById(supabaseUid).populate('profile');
          if (!user && email) {
            user = await User.findOne({ email }).populate('profile');
          }

          // Auto-sync user if not in database yet (mirroring Django SupabaseAuthentication)
          if (!user) {
            let username = meta.user_name || meta.username || meta.preferred_username;
            if (!username && email) {
              username = email.split('@')[0];
            }
            if (!username) {
              username = `user_${supabaseUid.slice(0, 8)}`;
            }

            // Ensure unique username
            const existingUsername = await User.findOne({ username });
            if (existingUsername) {
              username = `${username}_${supabaseUid.slice(0, 4)}`;
            }

            user = await User.create({
              _id: supabaseUid,
              username,
              email: email || `${username}@vibehub.user`,
              first_name: meta.full_name?.split(' ')[0] || '',
              last_name: meta.full_name?.split(' ').slice(1).join(' ') || '',
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
        }
      } catch {
        // Supabase verification failed
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

    try {
      const decodedNative = jwt.verify(token, config.jwt.secret);
      if (decodedNative?.id) {
        user = await User.findById(decodedNative.id).populate('profile');
      }
    } catch {
      // Ignore
    }

    if (!user && config.supabase.jwtSecret) {
      try {
        const decodedSupabase = jwt.verify(token, config.supabase.jwtSecret);
        if (decodedSupabase?.sub) {
          user = await User.findById(decodedSupabase.sub).populate('profile');
        }
      } catch {
        // Ignore
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
