import crypto from 'node:crypto';

import bcrypt from 'bcryptjs';

import { AuthSession, User } from '../models/index.js';
import { DEMO_USER_EMAIL, ensureUserJars, getLegacyDemoUser, migrateLegacyDemoUser } from './demoSeedService.js';

export const AUTH_COOKIE_NAME = 'finance_ai_session';
const PASSWORD_MIN_LENGTH = 8;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const SESSION_TOUCH_INTERVAL_MS = 1000 * 60 * 15;

const hashSessionToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const normalizeEmail = (value) => `${value || ''}`.trim().toLowerCase();

const requireDisplayName = (value) => {
  const parsedValue = `${value || ''}`.trim();

  if (!parsedValue) {
    throw new Error('display_name is required.');
  }

  return parsedValue;
};

const requireEmail = (value) => {
  const parsedValue = normalizeEmail(value);

  if (!parsedValue) {
    throw new Error('email is required.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsedValue)) {
    throw new Error('email is invalid.');
  }

  return parsedValue;
};

const requirePassword = (value) => {
  const parsedValue = `${value || ''}`;

  if (parsedValue.length < PASSWORD_MIN_LENGTH) {
    throw new Error(`password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
  }

  return parsedValue;
};

export const serializeUser = (user) => ({
  _id: user._id,
  display_name: user.display_name,
  email: user.email,
  base_currency: user.base_currency,
  locale: user.locale,
  timezone: user.timezone,
  created_at: user.created_at,
  updated_at: user.updated_at,
  last_login_at: user.last_login_at
});

const createSessionRecord = async (user, { ipAddress = '', userAgent = '' } = {}) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const lastLoginAt = new Date();

  await AuthSession.create({
    user_id: user._id,
    token_hash: hashSessionToken(token),
    expires_at: expiresAt,
    ip_address: ipAddress || undefined,
    user_agent: userAgent || undefined,
    last_seen_at: lastLoginAt
  });

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        last_login_at: lastLoginAt
      }
    }
  );

  user.last_login_at = lastLoginAt;

  return {
    token,
    expiresAt
  };
};

export const hashPassword = async (password) => bcrypt.hash(password, 12);

const maybeMigrateLegacyDemoUser = async ({ displayName, email, passwordHash }) => {
  const hasRegisteredUsers = await User.exists({
    password_hash: { $exists: true, $nin: [null, ''] }
  });

  if (hasRegisteredUsers) {
    return null;
  }

  const legacyDemoUser = await getLegacyDemoUser();

  if (!legacyDemoUser || legacyDemoUser.password_hash) {
    return null;
  }

  return migrateLegacyDemoUser({
    displayName,
    email,
    passwordHash
  });
};

export const registerUser = async (payload, sessionMeta = {}) => {
  const displayName = requireDisplayName(payload.display_name);
  const email = requireEmail(payload.email);
  const password = requirePassword(payload.password);
  const passwordHash = await hashPassword(password);
  const existingUser = await User.findOne({ email });

  if (existingUser?.password_hash) {
    throw new Error('Email này đã được sử dụng.');
  }

  if (existingUser && existingUser.email !== DEMO_USER_EMAIL) {
    throw new Error('Email này đã được sử dụng.');
  }

  let user =
    (await maybeMigrateLegacyDemoUser({
      displayName,
      email,
      passwordHash
    })) || null;

  if (!user) {
    user = await User.create({
      display_name: displayName,
      email,
      password_hash: passwordHash,
      base_currency: 'VND',
      locale: 'vi-VN',
      timezone: 'Asia/Ho_Chi_Minh',
      is_demo: false
    });
    await ensureUserJars(user._id);
  }

  const session = await createSessionRecord(user, sessionMeta);

  return {
    message: 'Đăng ký thành công.',
    data: {
      user: serializeUser(user)
    },
    session
  };
};

export const loginUser = async (payload, sessionMeta = {}) => {
  const email = requireEmail(payload.email);
  const password = requirePassword(payload.password);
  const user = await User.findOne({ email });

  if (!user?.password_hash) {
    throw new Error('Email hoặc mật khẩu không đúng.');
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new Error('Email hoặc mật khẩu không đúng.');
  }

  const session = await createSessionRecord(user, sessionMeta);

  return {
    message: 'Đăng nhập thành công.',
    data: {
      user: serializeUser(user)
    },
    session
  };
};

export const deleteSessionByToken = async (token) => {
  if (!token) {
    return;
  }

  await AuthSession.deleteOne({
    token_hash: hashSessionToken(token)
  });
};

export const resolveAuthenticatedSession = async (token) => {
  if (!token) {
    return null;
  }

  const now = new Date();
  const session = await AuthSession.findOne({
    token_hash: hashSessionToken(token),
    expires_at: { $gt: now }
  }).populate('user_id');

  if (!session?.user_id) {
    return null;
  }

  if (
    !session.last_seen_at ||
    now.getTime() - new Date(session.last_seen_at).getTime() >= SESSION_TOUCH_INTERVAL_MS
  ) {
    session.last_seen_at = now;
    await session.save();
  }

  return {
    session,
    user: session.user_id
  };
};

export const buildAuthCookieOptions = (expiresAt) => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  expires: expiresAt,
  path: '/'
});
