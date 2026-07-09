require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'adminweal';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`Admin (${adminEmail}) already exists`);
    return;
  }

  const hashed = await bcrypt.hash(adminPassword, 10);
  await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashed,
      name: 'Master Admin',
      role: 'ADMIN'
    }
  });
  console.log(`Admin created: ${adminEmail} / (password from .env)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
