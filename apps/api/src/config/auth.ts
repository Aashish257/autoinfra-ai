export const AUTH_CONFIG = {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
    accessTokenExpiry: '15m',   // short-lived
    refreshTokenExpiry: '7d',   // long-lived
    bcryptRounds: 12,
};