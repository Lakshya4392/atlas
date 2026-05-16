const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function clean() {
  await p.cachedProduct.deleteMany();
  console.log('Database wiped.');
  await p.$disconnect();
}
clean();
