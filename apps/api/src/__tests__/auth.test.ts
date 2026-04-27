import request from 'supertest';
import app from '../index.js';
import { prisma } from '../config/db.js';

beforeEach(async () => {
    await prisma.user.deleteMany();
});

describe('POST /api/auth/register', () => {
    it('registers a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Test User', email: 'test@test.com', password: 'secret123' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body.user.email).toBe('test@test.com');
    });

    it('rejects duplicate email', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({ name: 'User', email: 'dupe@test.com', password: 'secret123' });

        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'User2', email: 'dupe@test.com', password: 'secret123' });

        expect(res.status).toBe(409);
    });
});

describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({ name: 'Test', email: 'login@test.com', password: 'secret123' });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'login@test.com', password: 'secret123' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
    });

    it('rejects wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'login@test.com', password: 'wrongpass' });

        expect(res.status).toBe(401);
    });
});