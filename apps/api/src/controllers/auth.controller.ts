import type { Request, Response } from 'express';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import * as AuthService from '../services/auth.service.js';

export async function register(req: Request, res: Response) {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }

    try {
        const result = await AuthService.registerUser(parsed.data);
        return res.status(201).json(result);
    } catch (err: any) {
        if (err.message === 'EMAIL_TAKEN') {
            return res.status(409).json({ error: 'Email already registered' });
        }
        return res.status(500).json({ error: 'Registration failed' });
    }
}

export async function login(req: Request, res: Response) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }

    try {
        const result = await AuthService.loginUser(parsed.data);
        return res.status(200).json(result);
    } catch (err: any) {
        if (err.message === 'INVALID_CREDENTIALS') {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        return res.status(500).json({ error: 'Login failed' });
    }
}

export async function refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    try {
        const result = await AuthService.refreshTokens(refreshToken);
        return res.status(200).json(result);
    } catch (err: any) {
        return res.status(401).json({ error: 'Invalid refresh token' });
    }
}

export async function logout(req: Request, res: Response) {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    await AuthService.logoutUser(refreshToken);
    return res.status(200).json({ message: 'Logged out' });
}

export async function me(req: Request, res: Response) {
    return res.status(200).json({ user: req.user });
}