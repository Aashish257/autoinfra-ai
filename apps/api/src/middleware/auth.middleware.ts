import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/tokens.js';
import type { TokenPayload } from '../config/tokens.js';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing token' });
    }

    const token = header.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Invalid token format' });

    try {
        req.user = verifyAccessToken(token);
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

export function authorize(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}