import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { searchFashionProducts } from '../services/serpApiService';

const prisma = new PrismaClient();

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

const getCachedOrFetch = async (query: string) => {
  // First, check exact query match
  let cached = await prisma.cachedProduct.findMany({
    where: { query },
    take: 50
  });

  // If no exact match, search titles using the query terms
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

  // If still empty, just grab some random fallback products from the DB so we ALWAYS return something
  if (cached.length === 0) {
    cached = await prisma.cachedProduct.findMany({ take: 10 });
    // Randomize them
    cached = cached.sort(() => 0.5 - Math.random());
  }

  if (cached.length > 0) {
    return cached;
  }

  // Fetch from API if not in cache
  const results = await searchFashionProducts(query);
  
  // Save to DB to minimize future API calls
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
    const { userId } = req.params;

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
    const { id } = req.params;
    const item = await prisma.cachedProduct.findUnique({
      where: { id },
    });
    
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found in cache' });
    }

    return res.json({
      success: true,
      item: {
        ...item,
        name: item.title,         // Normalize for frontend
        imageUrl: item.thumbnail, // Normalize for frontend
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while fetching cached item',
    });
  }
};
