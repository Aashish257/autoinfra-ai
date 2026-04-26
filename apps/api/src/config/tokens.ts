import jwt from 'jsonwebtoken';
import { AUTH_CONFIG } from './auth.js';

export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}

export function signAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, AUTH_CONFIG.accessTokenSecret as string, {
        expiresIn: AUTH_CONFIG.accessTokenExpiry as any,
    });
}

export function signRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, AUTH_CONFIG.refreshTokenSecret as string, {
        expiresIn: AUTH_CONFIG.refreshTokenExpiry as any,
    });
}

export function verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, AUTH_CONFIG.accessTokenSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, AUTH_CONFIG.refreshTokenSecret) as TokenPayload;
}