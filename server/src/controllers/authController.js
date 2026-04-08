import {
  AUTH_COOKIE_NAME,
  buildAuthCookieOptions,
  deleteSessionByToken,
  loginUser,
  registerUser,
  serializeUser
} from '../services/authService.js';

const getSessionMeta = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get('user-agent') || ''
});

const applySessionCookie = (res, session) => {
  res.cookie(AUTH_COOKIE_NAME, session.token, buildAuthCookieOptions(session.expiresAt));
};

const clearSessionCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });
};

export const postRegister = async (req, res, next) => {
  try {
    const result = await registerUser(req.body, getSessionMeta(req));
    applySessionCookie(res, result.session);
    res.status(201).json({
      message: result.message,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

export const postLogin = async (req, res, next) => {
  try {
    const result = await loginUser(req.body, getSessionMeta(req));
    applySessionCookie(res, result.session);
    res.status(200).json({
      message: result.message,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

export const postLogout = async (req, res, next) => {
  try {
    await deleteSessionByToken(req.authToken);
    clearSessionCookie(res);
    res.status(200).json({
      message: 'Đăng xuất thành công.'
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      message: 'Thông tin người dùng đã được tải.',
      data: {
        user: serializeUser(req.user)
      }
    });
  } catch (error) {
    next(error);
  }
};
