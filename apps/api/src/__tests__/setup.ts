import { prisma } from '../config/db.js';

afterAll(async () => {
    await prisma.$disconnect();
});