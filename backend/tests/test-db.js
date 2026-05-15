const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function test() {
  try {
    const count = await p.cachedProduct.count();
    console.log('DB OK, CachedProduct count:', count);
    
    const shoes = await p.cachedProduct.count({ where: { category: 'Shoes' } });
    console.log('Shoes count:', shoes);
    
    const tops = await p.cachedProduct.count({ where: { category: 'Tops' } });
    console.log('Tops count:', tops);
    
    const all = await p.cachedProduct.findMany({ take: 3 });
    console.log('Sample items:', all.map(i => ({ id: i.id, title: i.title, category: i.category })));
  } catch (e) {
    console.log('DB ERROR:', e.message);
  } finally {
    await p.$disconnect();
  }
}

test();
