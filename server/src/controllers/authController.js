import {
  AUTH_COOKIE_NAME,
  buildAuthCookieOptions,
  deleteSessionByToken,
  loginUser,
  registerUser,
  serializeUser
} from '../services/authService.js';
import { reclassifyImportedTransactions } from '../services/importExcelService.js';

const getSessionMeta = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get('user-agent') || ''
});

const applySessionCookie = (res, session) => {
  res.cookie(
    AUTH_COOKIE_NAME,
    session.token,
    buildAuthCookieOptions(session.expiresAt, {
      requestOrigin: res.req.get('origin') || '',
      requestProtocol: res.req.protocol
    })
  );
};

const clearSessionCookie = (res) => {
  res.clearCookie(
    AUTH_COOKIE_NAME,
    buildAuthCookieOptions(new Date(0), {
      requestOrigin: res.req.get('origin') || '',
      requestProtocol: res.req.protocol
    })
  );
};

export const postRegister = async (req, res, next) => {
  try {
    const result = await registerUser(req.body, getSessionMeta(req));
    applySessionCookie(res, result.session);
    res.status(201).json({
      message: result.message,
      data: result.data
    });
    reclassifyImportedTransactions(result.data.user._id).catch((e) => console.error('Auto-classify error:', e));
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
    reclassifyImportedTransactions(result.data.user._id).catch((e) => console.error('Auto-classify error:', e));
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
    reclassifyImportedTransactions(req.user._id).catch((e) => console.error('Auto-classify error:', e));
  } catch (error) {
    next(error);
  }
};
