const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// Batch update using raw SQL for speed on Neon free tier
async function run() {
  console.log('--- Batch updating categories via SQL ---');
  
  // Shoes
  const shoes = await p.$executeRawUnsafe(`UPDATE "CachedProduct" SET category = 'Shoes' WHERE category IS NULL AND (LOWER(title) LIKE '%shoe%' OR LOWER(title) LIKE '%sneaker%' OR LOWER(title) LIKE '%boot%' OR LOWER(title) LIKE '%sandal%' OR LOWER(title) LIKE '%loafer%')`);
  console.log('Shoes updated:', shoes);

  // Bottoms
  const bottoms = await p.$executeRawUnsafe(`UPDATE "CachedProduct" SET category = 'Bottoms' WHERE category IS NULL AND (LOWER(title) LIKE '%pant%' OR LOWER(title) LIKE '%jean%' OR LOWER(title) LIKE '%trouser%' OR LOWER(title) LIKE '%short%' OR LOWER(title) LIKE '%chino%' OR LOWER(title) LIKE '%jogger%')`);
  console.log('Bottoms updated:', bottoms);

  // Outerwear
  const outer = await p.$executeRawUnsafe(`UPDATE "CachedProduct" SET category = 'Outerwear' WHERE category IS NULL AND (LOWER(title) LIKE '%jacket%' OR LOWER(title) LIKE '%coat%' OR LOWER(title) LIKE '%hoodie%' OR LOWER(title) LIKE '%sweater%' OR LOWER(title) LIKE '%bomber%' OR LOWER(title) LIKE '%sweatshirt%' OR LOWER(title) LIKE '%zip%' OR LOWER(title) LIKE '%parka%')`);
  console.log('Outerwear updated:', outer);

  // Hats
  const hats = await p.$executeRawUnsafe(`UPDATE "CachedProduct" SET category = 'Hats' WHERE category IS NULL AND (LOWER(title) LIKE '%hat%' OR LOWER(title) LIKE '%cap%' OR LOWER(title) LIKE '%beanie%')`);
  console.log('Hats updated:', hats);

  // Accessories
  const acc = await p.$executeRawUnsafe(`UPDATE "CachedProduct" SET category = 'Accessories' WHERE category IS NULL AND (LOWER(title) LIKE '%bag%' OR LOWER(title) LIKE '%watch%' OR LOWER(title) LIKE '%belt%' OR LOWER(title) LIKE '%sunglasses%' OR LOWER(title) LIKE '%wallet%')`);
  console.log('Accessories updated:', acc);

  // Everything else = Tops
  const tops = await p.$executeRawUnsafe(`UPDATE "CachedProduct" SET category = 'Tops' WHERE category IS NULL`);
  console.log('Tops (default) updated:', tops);

  // Final counts
  const cats = ['Tops', 'Bottoms', 'Shoes', 'Hats', 'Outerwear', 'Accessories'];
  for (const cat of cats) {
    const c = await p.cachedProduct.count({ where: { category: cat } });
    console.log(`  ${cat}: ${c}`);
  }

  await p.$disconnect();
  console.log('Done!');
}

run();
