export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
export const AUTH_UNAUTHORIZED_EVENT = 'finance-auth-unauthorized';

const GET_CACHE_PREFIX = 'finance-api-cache:';
const DEFAULT_GET_CACHE_TTL_MS = 60 * 1000;
const memoryCache = new Map();
const inFlightRequests = new Map();

const buildCacheKey = (path) => `${GET_CACHE_PREFIX}${path}`;

const readSessionCache = (cacheKey) => {
  try {
    const rawValue = window.sessionStorage.getItem(cacheKey);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : null;
  } catch {
    return null;
  }
};

const writeSessionCache = (cacheKey, entry) => {
  try {
    window.sessionStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch {
    // Ignore storage failures so network requests still work.
  }
};

const readCachedValue = (cacheKey, cacheTtlMs) => {
  const now = Date.now();
  const inMemoryEntry = memoryCache.get(cacheKey);

  if (inMemoryEntry && now - inMemoryEntry.timestamp < cacheTtlMs) {
    return inMemoryEntry.data;
  }

  const sessionEntry = readSessionCache(cacheKey);

  if (sessionEntry && now - sessionEntry.timestamp < cacheTtlMs) {
    memoryCache.set(cacheKey, sessionEntry);
    return sessionEntry.data;
  }

  return null;
};

const storeCachedValue = (cacheKey, data) => {
  const entry = {
    timestamp: Date.now(),
    data
  };

  memoryCache.set(cacheKey, entry);
  writeSessionCache(cacheKey, entry);
};

export const clearApiCache = () => {
  memoryCache.clear();
  inFlightRequests.clear();

  try {
    Object.keys(window.sessionStorage)
      .filter((key) => key.startsWith(GET_CACHE_PREFIX))
      .forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // Ignore storage failures.
  }
};

const dispatchUnauthorizedEvent = () => {
  try {
    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
  } catch {
    // Ignore browser event failures.
  }
};

const parseJsonResponse = async (response) => {
  const rawText = await response.text();

  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
};

export const apiRequest = async (path, options = {}) => {
  const {
    cacheTtlMs = DEFAULT_GET_CACHE_TTL_MS,
    skipCache = false,
    headers = {},
    ...fetchOptions
  } = options;
  const method = (fetchOptions.method || 'GET').toUpperCase();
  const isGetRequest = method === 'GET';
  const cacheKey = buildCacheKey(path);
  const isFormDataBody =
    typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;
  const requestHeaders = {
    ...headers
  };

  if (!isFormDataBody && !Object.keys(requestHeaders).some((key) => key.toLowerCase() === 'content-type')) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (isGetRequest && !skipCache) {
    const cachedValue = readCachedValue(cacheKey, cacheTtlMs);

    if (cachedValue !== null) {
      return cachedValue;
    }

    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey);
    }
  }

  const requestPromise = fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: requestHeaders,
    ...fetchOptions
  }).then(async (response) => {
    const payload = await parseJsonResponse(response);

    if (!response.ok) {
      if (response.status === 401) {
        clearApiCache();
        dispatchUnauthorizedEvent();
      }

      const errorMessage =
        payload?.message || payload?.error || payload?.detail || `Yeu cau that bai: ${response.status}`;
      const error = new Error(errorMessage);
      error.statusCode = response.status;
      throw error;
    }

    if (isGetRequest && !skipCache) {
      storeCachedValue(cacheKey, payload);
    } else if (!isGetRequest) {
      clearApiCache();
    }

    return payload;
  });

  if (isGetRequest && !skipCache) {
    inFlightRequests.set(cacheKey, requestPromise);
  }

  try {
    return await requestPromise;
  } finally {
    if (isGetRequest && !skipCache) {
      inFlightRequests.delete(cacheKey);
    }
  }
};
