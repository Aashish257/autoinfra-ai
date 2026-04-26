import 'dotenv/config';
import { prisma } from './src/config/db.js';

async function main() {
    await prisma.user.update({
        where: { email: 'a@test.com' },
        data: { role: 'DEVELOPER' },
    });
    console.log('User role updated to DEVELOPER');
    process.exit(0);
}

main();
