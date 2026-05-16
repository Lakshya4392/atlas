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

    // Since we now have a rich seeded database, just grab a random mix of items from the database
    // instead of doing slow live SerpAPI searches for specific strings.
    const items = await prisma.cachedProduct.findMany({
      take: 60,
    });

    const shuffled = items.sort(() => 0.5 - Math.random());

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
    
    // Map main category to all possible stored category names (case-insensitive)
    const categoryAliases: Record<string, string[]> = {
      'Tops': ['Tops', 'tops', 'shirt', 'Shirt', 'tshirt', 'T-Shirt', 't-shirt'],
      'Bottoms': ['Bottoms', 'bottoms', 'pants', 'Pants', 'jeans', 'Jeans', 'shorts', 'Shorts', 'Skirts', 'skirts'],
      'Shoes': ['Shoes', 'shoes', 'sneakers', 'Sneakers', 'boots', 'Boots', 'footwear', 'heels'],
      'Outerwear': ['Outerwear', 'outerwear', 'jacket', 'Jacket', 'jackets', 'coat', 'hoodie'],
      'Hats': ['Hats', 'hats', 'hat', 'caps', 'Caps', 'beanie'],
      'Accessories': ['Accessories', 'accessories', 'watch', 'Watch', 'bag', 'Bag', 'jewelry', 'Jewelry'],
      'Dresses': ['Dresses', 'dresses', 'dress', 'Dress', 'casual', 'evening', 'gowns'],
    };

    const aliases = categoryAliases[cat] || [cat];
    
    const whereClause: any = { category: { in: aliases } };
    if (req.query.gender) {
        whereClause.gender = req.query.gender as string;
    }

    // Check DB — query all aliases
    let items = await prisma.cachedProduct.findMany({
      where: whereClause,
      take: 100, // Increased limit so we see the massive variety we seeded
      orderBy: { createdAt: 'desc' }
    });

    // DB-only: no SerpAPI fallback

    return res.json({ success: true, data: items });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/fashion/seed — wipe and re-seed all categories with proper deep 3-level taxonomy
export const seedAllCategories = async (req: Request, res: Response): Promise<any> => {
  const taxonomy = [
    // --- MEN'S TOPS ---
    { gender: 'Men', category: 'Tops', subcategory: 'T-Shirts', style: 'Graphic', color: 'Mixed', material: 'Cotton', query: "men's graphic print t-shirt flat lay clothing -model" },
    { gender: 'Men', category: 'Tops', subcategory: 'T-Shirts', style: 'Oversized', color: 'Mixed', material: 'Cotton', query: "men's oversized t-shirt flat lay clothing -model" },
    { gender: 'Men', category: 'Tops', subcategory: 'Shirts', style: 'Flannel', color: 'Plaid', material: 'Flannel', query: "men's flannel shirt plaid flat lay clothing -model" },
    { gender: 'Men', category: 'Tops', subcategory: 'Shirts', style: 'Oxford', color: 'Solid', material: 'Cotton', query: "men's oxford button down shirt flat lay clothing -model" },
    { gender: 'Men', category: 'Tops', subcategory: 'Polo', style: 'Classic', color: 'Mixed', material: 'Pique', query: "men's polo shirt classic fit flat lay clothing -model" },

    // --- MEN'S BOTTOMS ---
    { gender: 'Men', category: 'Bottoms', subcategory: 'Jeans', style: 'Slim Fit', color: 'Blue', material: 'Denim', query: "men's slim fit jeans blue flat lay clothing -model" },
    { gender: 'Men', category: 'Bottoms', subcategory: 'Jeans', style: 'Baggy', color: 'Mixed', material: 'Denim', query: "men's baggy jeans wide leg flat lay clothing -model" },
    { gender: 'Men', category: 'Bottoms', subcategory: 'Trousers', style: 'Chinos', color: 'Khaki', material: 'Cotton', query: "men's chinos trousers flat lay clothing -model" },
    { gender: 'Men', category: 'Bottoms', subcategory: 'Shorts', style: 'Cargo', color: 'Olive', material: 'Cotton', query: "men's cargo shorts flat lay clothing -model" },

    // --- MEN'S SHOES ---
    { gender: 'Men', category: 'Shoes', subcategory: 'Sneakers', style: 'Chunky', color: 'Mixed', material: 'Mixed', query: "men's chunky sneakers trending flat lay -model" },
    { gender: 'Men', category: 'Shoes', subcategory: 'Sneakers', style: 'Classic', color: 'White', material: 'Leather', query: "men's classic white sneakers flat lay -model" },
    { gender: 'Men', category: 'Shoes', subcategory: 'Loafers', style: 'Formal', color: 'Brown', material: 'Suede', query: "men's suede loafers shoes flat lay -model" },

    // --- MEN'S OUTERWEAR ---
    { gender: 'Men', category: 'Outerwear', subcategory: 'Jackets', style: 'Denim', color: 'Blue', material: 'Denim', query: "men's denim jacket flat lay clothing -model" },
    { gender: 'Men', category: 'Outerwear', subcategory: 'Jackets', style: 'Bomber', color: 'Mixed', material: 'Nylon', query: "men's bomber jacket flat lay clothing -model" },
    { gender: 'Men', category: 'Outerwear', subcategory: 'Hoodies', style: 'Streetwear', color: 'Mixed', material: 'Fleece', query: "men's streetwear hoodie flat lay clothing -model" },

    // --- WOMEN'S TOPS ---
    { gender: 'Women', category: 'Tops', subcategory: 'Blouses', style: 'Formal', color: 'White', material: 'Silk', query: "women's formal silk blouse flat lay clothing -model" },
    { gender: 'Women', category: 'Tops', subcategory: 'T-Shirts', style: 'Crop Top', color: 'Mixed', material: 'Cotton', query: "women's crop top t-shirt flat lay clothing -model" },
    { gender: 'Women', category: 'Tops', subcategory: 'Sweaters', style: 'Knit', color: 'Beige', material: 'Wool', query: "women's knit sweater cardigan flat lay clothing -model" },

    // --- WOMEN'S BOTTOMS ---
    { gender: 'Women', category: 'Bottoms', subcategory: 'Jeans', style: 'High-Waisted', color: 'Blue', material: 'Denim', query: "women's high waisted jeans flat lay clothing -model" },
    { gender: 'Women', category: 'Bottoms', subcategory: 'Skirts', style: 'Pleated', color: 'Mixed', material: 'Cotton', query: "women's pleated midi skirt flat lay clothing -model" },
    { gender: 'Women', category: 'Bottoms', subcategory: 'Trousers', style: 'Wide Leg', color: 'Black', material: 'Polyester', query: "women's wide leg trousers flat lay clothing -model" },

    // --- WOMEN'S DRESSES ---
    { gender: 'Women', category: 'Dresses', subcategory: 'Casual', style: 'Floral', color: 'Mixed', material: 'Cotton', query: "women's floral summer dress flat lay clothing -model" },
    { gender: 'Women', category: 'Dresses', subcategory: 'Evening', style: 'Bodycon', color: 'Black', material: 'Velvet', query: "women's black evening dress flat lay clothing -model" },

    // --- WOMEN'S SHOES ---
    { gender: 'Women', category: 'Shoes', subcategory: 'Heels', style: 'Stilettos', color: 'Nude', material: 'Leather', query: "women's stiletto heels shoes flat lay -model" },
    { gender: 'Women', category: 'Shoes', subcategory: 'Sneakers', style: 'Casual', color: 'White', material: 'Canvas', query: "women's casual white sneakers flat lay -model" },

    // --- WOMEN'S OUTERWEAR ---
    { gender: 'Women', category: 'Outerwear', subcategory: 'Jackets', style: 'Leather', color: 'Black', material: 'Leather', query: "women's black leather biker jacket flat lay clothing -model" },
    { gender: 'Women', category: 'Outerwear', subcategory: 'Coats', style: 'Trench', color: 'Camel', material: 'Cotton', query: "women's camel trench coat flat lay clothing -model" },
  ];

  // Step 1: Delete ALL existing cached products
  const deleted = await prisma.cachedProduct.deleteMany({});
  console.log(`Seed: Deleted ${deleted.count} old items`);

  const results: Record<string, number> = {};

  // Step 2: Fetch each specific style in the taxonomy
  for (const t of taxonomy) {
    const key = `${t.gender}/${t.category}/${t.subcategory}/${t.style}`;
    try {
      // Pass the taxonomy object down as metadata
      const items = await searchFashionProducts(t.query, {
        gender: t.gender,
        category: t.category,
        subcategory: t.subcategory,
        style: t.style,
        material: t.material,
        color: t.color,
        metadata: {
            fit: t.style,
            pattern: t.color === 'Plaid' || t.color === 'Floral' ? t.color : 'Solid/Mixed'
        }
      });
      
      if (items.length > 0) {
        await prisma.cachedProduct.createMany({
          data: items.map((r: any) => ({
            query: t.query,
            title: r.title || '',
            brand: r.brand || '',
            price: r.price || '',
            thumbnail: r.thumbnail || '',
            link: r.link || '',
            source: r.source || '',
            category: r.category || t.category, 
            subcategory: r.subcategory || t.subcategory,
            gender: r.gender || t.gender,
            color: r.color || t.color,
            material: r.material || t.material,
            style: r.style || t.style,
            metadata: r.metadata || {},
          }))
        });
      }
      results[key] = items.length;
      console.log(`Seed: ${key} → ${items.length} items`);
    } catch (e: any) {
      results[key] = 0;
      console.error(`Seed ${key} failed:`, e.message);
    }
  }

  // Count totals per gender
  const totals = await prisma.cachedProduct.groupBy({ by: ['gender'], _count: true });
  const summary: Record<string, number> = {};
  totals.forEach(t => { summary[t.gender || 'unknown'] = t._count; });

  return res.json({ success: true, seeded: results, totals: summary, deletedOld: deleted.count });
};
