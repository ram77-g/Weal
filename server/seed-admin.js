require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || 'adminweal';
  const hashed = await bcrypt.hash(adminPassword, 10);

  for (let i = 1; i <= 5; i++) {
    const email = `admin${i}@weal.com`;
    const name = `Admin ${i}`;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`Admin (${email}) already exists`);
      continue;
    }

    await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: 'ADMIN'
      }
    });
    console.log(`Admin created: ${email}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
