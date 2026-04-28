import rateLimit from "express-rate-limit";

const isProduction = process.env.NODE_ENV === "production";

const toPositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

const isLoopbackRequest = (ip: string | undefined): boolean => {
  if (!ip) return false;
  return ip === "127.0.0.1" || ip === "::1" || ip.startsWith("::ffff:127.0.0.1");
};

const defaultWindowMs = 10 * 60 * 1000;

const rateLimitResponse = (code: string, message: string) => ({
  success: false,
  error: { code, message },
});

export const loginLimiter = rateLimit({
  windowMs: toPositiveInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, defaultWindowMs),
  max: toPositiveInt(process.env.LOGIN_RATE_LIMIT_MAX, isProduction ? 5 : 60),
  // In development, local testing can hit /login frequently; skip local loopback traffic.
  skip: (req) => !isProduction && isLoopbackRequest(req.ip),
  // Count only failed logins to preserve brute-force protection without blocking valid sessions.
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse("RATE_LIMIT_EXCEEDED", "Too many login attempts, please try again later"),
});

export const registerLimiter = rateLimit({
  windowMs: toPositiveInt(process.env.REGISTER_RATE_LIMIT_WINDOW_MS, defaultWindowMs),
  max: toPositiveInt(process.env.REGISTER_RATE_LIMIT_MAX, isProduction ? 3 : 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse("RATE_LIMIT_EXCEEDED", "Too many registration attempts, please try again later"),
});

export const refreshLimiter = rateLimit({
  windowMs: toPositiveInt(process.env.REFRESH_RATE_LIMIT_WINDOW_MS, defaultWindowMs),
  max: toPositiveInt(process.env.REFRESH_RATE_LIMIT_MAX, isProduction ? 10 : 120),
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse("RATE_LIMIT_EXCEEDED", "Too many token refresh attempts, please try again later"),
});

export const globalLimiter = rateLimit({
  windowMs: toPositiveInt(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS, defaultWindowMs),
  max: toPositiveInt(process.env.GLOBAL_RATE_LIMIT_MAX, isProduction ? 1000 : 5000),
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse("RATE_LIMIT_EXCEEDED", "Too many requests, please try again later"),
});
