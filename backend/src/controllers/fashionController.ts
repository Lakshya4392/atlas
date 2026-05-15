import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { searchFashionProducts } from '../services/serpApiService';

export const searchFashion = async (req: Request, res: Response): Promise<any> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Query parameter "q" is required' 
      });
    }

    const results = await getCachedOrFetch(q);

    return res.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while fetching fashion products',
    });
  }
};

// Helper: guess category from query string
const guessCategory = (query: string): string => {
  const q = query.toLowerCase();
  if (q.includes('shoe') || q.includes('sneaker') || q.includes('boot')) return 'Shoes';
  if (q.includes('pant') || q.includes('jean') || q.includes('trouser') || q.includes('bottom')) return 'Bottoms';
  if (q.includes('jacket') || q.includes('coat') || q.includes('hoodie') || q.includes('outerwear')) return 'Outerwear';
  if (q.includes('hat') || q.includes('cap') || q.includes('beanie')) return 'Hats';
  if (q.includes('accessori') || q.includes('watch') || q.includes('bag') || q.includes('sunglasses')) return 'Accessories';
  return 'Tops';
};

const getCachedOrFetch = async (query: string, category?: string) => {
  const cat = category || guessCategory(query);

  // First, check by category if provided
  if (category) {
    let cached = await prisma.cachedProduct.findMany({
      where: { category },
      take: 50
    });
    if (cached.length > 0) return cached;
  }

  // Check exact query match
  let cached = await prisma.cachedProduct.findMany({
    where: { query },
    take: 50
  });

  if (cached.length === 0) {
    const searchTerms = query.split(' ').filter(t => t.length > 2);
    if (searchTerms.length > 0) {
      cached = await prisma.cachedProduct.findMany({
        where: {
          OR: searchTerms.map(term => ({
            title: { contains: term, mode: 'insensitive' }
          }))
        },
        take: 50
      });
    }
  }

  if (cached.length === 0) {
    cached = await prisma.cachedProduct.findMany({ take: 10 });
    cached = cached.sort(() => 0.5 - Math.random());
  }

  if (cached.length > 0) return cached;

  // Fetch from SerpAPI
  const results = await searchFashionProducts(query);
  
  if (results.length > 0) {
    try {
      await prisma.cachedProduct.createMany({
        data: results.map((r: any) => ({
          query,
          title: r.title || '',
          brand: r.brand || '',
          price: r.price || '',
          thumbnail: r.thumbnail || '',
          link: r.link || '',
          source: r.source || '',
          category: cat,
        }))
      });
    } catch (e) {
      console.error('Failed to cache results:', e);
    }
  }
  return results;
};

export const getPersonalizedFeed = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.params.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const preferredBrands = user.preferredBrands && user.preferredBrands.length > 0 
      ? user.preferredBrands 
      : ['Zara', 'H&M'];

    const mainBrand = preferredBrands[0];
    // Use the caching wrapper
    const personalizedResults = await getCachedOrFetch(`men's clothing ${mainBrand}`);
    const generalResults = await getCachedOrFetch('trending streetwear fashion');

    const combined = [...personalizedResults, ...generalResults];
    const shuffled = combined.sort(() => 0.5 - Math.random());

    return res.json({
      success: true,
      data: shuffled.slice(0, 50),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while generating personalized feed',
    });
  }
};

export const getCachedItem = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const item = await prisma.cachedProduct.findUnique({ where: { id } });
    
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });

    return res.json({
      success: true,
      item: { ...item, name: item.title, imageUrl: item.thumbnail }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/fashion/category/:cat — fetch items by category
export const getByCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const cat = req.params.cat as string;
    
    // Check DB first
    let items = await prisma.cachedProduct.findMany({
      where: { category: cat },
      take: 30,
      orderBy: { createdAt: 'desc' }
    });

    // If too few items, auto-fetch from SerpAPI
    if (items.length < 5) {
      const queries: Record<string, string> = {
        'Shoes': "men's trending sneakers shoes 2025",
        'Bottoms': "men's fashion pants jeans 2025",
        'Tops': "men's trending t-shirts tops 2025",
        'Hats': "men's fashion hats caps beanies 2025",
        'Outerwear': "men's jackets hoodies coats 2025",
        'Accessories': "men's fashion accessories watches bags 2025",
      };
      const query = queries[cat] || `men's ${cat} fashion 2025`;
      
      try {
        const results = await searchFashionProducts(query);
        if (results.length > 0) {
          await prisma.cachedProduct.createMany({
            data: results.map((r: any) => ({
              query,
              title: r.title || '',
              brand: r.brand || '',
              price: r.price || '',
              thumbnail: r.thumbnail || '',
              link: r.link || '',
              source: r.source || '',
              category: cat,
            }))
          });
          // Re-fetch from DB to get IDs
          items = await prisma.cachedProduct.findMany({
            where: { category: cat },
            take: 30,
            orderBy: { createdAt: 'desc' }
          });
        }
      } catch (e) {
        console.error(`SerpAPI fetch for ${cat} failed:`, e);
      }
    }

    return res.json({ success: true, data: items });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/fashion/seed — seed all categories at once
export const seedAllCategories = async (req: Request, res: Response): Promise<any> => {
  const categories: Record<string, string> = {
    'Shoes': "men's trending sneakers shoes 2025",
    'Bottoms': "men's fashion pants jeans 2025",
    'Tops': "men's trending t-shirts fashion 2025",
    'Hats': "men's fashion hats caps beanies 2025",
    'Outerwear': "men's jackets hoodies streetwear 2025",
    'Accessories': "men's fashion accessories watches bags 2025",
  };

  const results: Record<string, number> = {};

  for (const [cat, query] of Object.entries(categories)) {
    // Skip if already seeded
    const existing = await prisma.cachedProduct.count({ where: { category: cat } });
    if (existing > 0) {
      results[cat] = existing;
      continue;
    }

    try {
      const items = await searchFashionProducts(query);
      if (items.length > 0) {
        await prisma.cachedProduct.createMany({
          data: items.map((r: any) => ({
            query,
            title: r.title || '',
            brand: r.brand || '',
            price: r.price || '',
            thumbnail: r.thumbnail || '',
            link: r.link || '',
            source: r.source || '',
            category: cat,
          }))
        });
      }
      results[cat] = items.length;
    } catch (e: any) {
      results[cat] = 0;
      console.error(`Seed ${cat} failed:`, e.message);
    }
  }

  return res.json({ success: true, seeded: results });
};
