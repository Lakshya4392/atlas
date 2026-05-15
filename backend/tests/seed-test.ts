import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = 'cmov05vfc0000zjtlv91cfopo';
  
  // Clean up existing items for this test user if any
  await prisma.clothingItem.deleteMany({ where: { userId } });

  const items = [
    {
      userId,
      name: 'Classic Black Tee',
      category: 'tops',
      color: 'Black',
      brand: 'Uniqlo',
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop',
      tags: ['minimal', 'basic'],
    },
    {
      userId,
      name: 'Beige Heavy Hoodie',
      category: 'tops',
      color: 'Camel',
      brand: 'Fear of God',
      imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop',
      tags: ['essential', 'winter'],
    },
    {
      userId,
      name: 'Indigo Denim Jacket',
      category: 'outerwear',
      color: 'Navy',
      brand: 'Levis',
      imageUrl: 'https://images.unsplash.com/photo-1523205771623-e0faa4d2813d?q=80&w=1000&auto=format&fit=crop',
      tags: ['classic', 'layer'],
    },
    {
      userId,
      name: 'Grey Tailored Trousers',
      category: 'bottoms',
      color: 'Grey',
      brand: 'Zara',
      imageUrl: 'https://images.unsplash.com/photo-1624373248105-091703657375?q=80&w=1000&auto=format&fit=crop',
      tags: ['formal', 'clean'],
    },
    {
      userId,
      name: 'White Leather Sneakers',
      category: 'shoes',
      color: 'White',
      brand: 'Common Projects',
      imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1000&auto=format&fit=crop',
      tags: ['luxury', 'minimal'],
    }
  ];

  for (const item of items) {
    await prisma.clothingItem.create({ data: item });
  }

  console.log('✅ Wardrobe populated with 5 premium items for New York test!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
