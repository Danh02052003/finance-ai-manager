import { AUTH_COOKIE_NAME, resolveAuthenticatedSession } from '../services/authService.js';

const parseCookies = (cookieHeader = '') =>
  Object.fromEntries(
    cookieHeader
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const separatorIndex = item.indexOf('=');
        const key = separatorIndex >= 0 ? item.slice(0, separatorIndex) : item;
        const value = separatorIndex >= 0 ? item.slice(separatorIndex + 1) : '';
        return [key, decodeURIComponent(value)];
      })
  );

export const attachAuth = async (req, res, next) => {
  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies[AUTH_COOKIE_NAME] || '';
    const resolvedSession = await resolveAuthenticatedSession(token);

    req.authToken = token || '';
    req.authSession = resolvedSession?.session || null;
    req.user = resolvedSession?.user || null;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAuth = (req, res, next) => {
  if (!req.user?._id) {
    const error = new Error('Bạn cần đăng nhập để tiếp tục.');
    error.statusCode = 401;
    next(error);
    return;
  }

  next();
};
