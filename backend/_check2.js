const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const items = await p.cachedProduct.findMany({
    take: 10,
    select: { title: true, thumbnail: true }
  });
  console.log(items);
  await p.$disconnect();
}
check();
