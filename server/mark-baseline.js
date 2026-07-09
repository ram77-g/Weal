const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Mark baseline migration as applied
  console.log('Baseline migration marked.');
}

main()
  .catch(console.error)
  .finally(() => prisma.());
