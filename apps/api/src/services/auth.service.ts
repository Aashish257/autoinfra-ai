import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { setCache, getCache, deleteCache } from '../config/cache.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../config/tokens.js';
import { AUTH_CONFIG } from '../config/auth.js';
import type { RegisterInput, LoginInput } from '../validators/auth.validator.js';

export async function registerUser(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new Error('EMAIL_TAKEN');

    const hashed = await bcrypt.hash(input.password, AUTH_CONFIG.bcryptRounds);

    const user = await prisma.user.create({
        data: { name: input.name, email: input.email, password: hashed },
        select: { id: true, name: true, email: true, role: true },
    });

    return generateTokenPair(user);
}

export async function loginUser(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new Error('INVALID_CREDENTIALS');

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) throw new Error('INVALID_CREDENTIALS');

    return generateTokenPair(user);
}

export async function refreshTokens(token: string) {
    const payload = verifyRefreshToken(token); // throws if invalid/expired

    // Check token not blacklisted (logout invalidation)
    const blacklisted = await getCache(`blacklist:${token}`);
    if (blacklisted) throw new Error('TOKEN_REVOKED');

    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, role: true },
    });
    if (!user) throw new Error('USER_NOT_FOUND');

    return generateTokenPair(user);
}

export async function logoutUser(refreshToken: string) {
    // Blacklist refresh token in Redis until it expires (7d)
    await setCache(`blacklist:${refreshToken}`, '1', 60 * 60 * 24 * 7);
}

// ── helpers ──────────────────────────────────────────────
function generateTokenPair(user: { id: string; email: string; role: string }) {
    const payload = { userId: user.id, email: user.email, role: user.role };
    return {
        accessToken: signAccessToken(payload),
        refreshToken: signRefreshToken(payload),
        user: { id: user.id, email: user.email, role: user.role },
    };
}