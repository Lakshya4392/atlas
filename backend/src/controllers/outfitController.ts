import { Request, Response } from 'express';
import prisma from '../config/prisma';

// ── Get all outfits for a user ──
export const getOutfits = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const outfits = await prisma.outfit.findMany({
      where: { userId },
      include: { items: { include: { clothingItem: true } } },
    });
    res.json({ success: true, outfits });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ── Save AI-Generated Outfit ──
export const saveOutfit = async (req: Request, res: Response) => {
  try {
    const { userId, name, occasion, itemIds, aiGenerated, weather, imageUrl } = req.body;
    if (!userId || !name) {
      return res.status(400).json({ success: false, error: 'userId and name are required' });
    }
    const outfit = await prisma.outfit.create({
      data: {
        userId,
        name,
        occasion: occasion || 'Casual',
        aiGenerated: aiGenerated || false,
        weather: weather || '',
        imageUrl: imageUrl || null,
        ...(itemIds && itemIds.length > 0 ? {
          items: {
            create: itemIds.map((id: string) => ({ clothingItemId: id })),
          }
        } : {})
      },
      include: { items: { include: { clothingItem: true } } },
    });
    res.json({ success: true, outfit });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ══════════════════════════════════════════════════
// ── Smart Outfit Search Pipeline v2 ──
// Priority: User's Closet → Cached DB → Live SerpAPI → Type Fallback
// ══════════════════════════════════════════════════
export const searchItems = async (req: Request, res: Response) => {
  try {
    const { userId, queries } = req.body;
    
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({ success: false, error: 'queries array is required' });
    }

    console.log(`\n🔍 ═══ Outfit Pipeline v2 ═══`);
    console.log(`   User: ${userId || 'anonymous'}`);
    console.log(`   Items to find: ${queries.length}`);

    const results = await Promise.all(queries.map(async (q: any, idx: number) => {
      const searchTerm = q.searchQuery || q.name || 'fashion item';
      const category = q.category || q.type || 'unknown';
      const closetItemId = q.closetItemId || '';
      
      console.log(`\n  [${idx + 1}/${queries.length}] ${category.toUpperCase()}: "${q.name}"`);

      try {
        // ═══ LEVEL 1: USER'S OWN CLOSET ═══
        if (userId && closetItemId) {
          const closetItem = await prisma.clothingItem.findUnique({
            where: { id: closetItemId },
          });
          if (closetItem && closetItem.imageUrl) {
            console.log(`    ✅ L1 CLOSET HIT: "${closetItem.name}"`);
            return {
              type: q.type, category, name: closetItem.name, reason: q.reason,
              imageUrl: closetItem.imageUrl, title: closetItem.name,
              brand: closetItem.brand || '', price: '', link: '',
              source: 'from_closet', closetItemId: closetItem.id,
            };
          }
        }
        
        // Fuzzy closet match by category + color
        if (userId) {
          const colorWords = searchTerm.split(' ').filter((w: string) => 
            ['black','white','blue','navy','brown','grey','gray','red','green','beige','khaki','pink'].includes(w.toLowerCase())
          );
          const closetMatch = await prisma.clothingItem.findFirst({
            where: {
              userId,
              AND: [
                { category: { contains: category, mode: 'insensitive' } },
                ...(colorWords.length > 0 ? [{ color: { contains: colorWords[0], mode: 'insensitive' as any } }] : []),
              ],
            },
          });
          if (closetMatch && closetMatch.imageUrl) {
            console.log(`    ✅ L1 CLOSET FUZZY: "${closetMatch.name}"`);
            return {
              type: q.type, category, name: closetMatch.name, reason: q.reason + ' (from your closet!)',
              imageUrl: closetMatch.imageUrl, title: closetMatch.name,
              brand: closetMatch.brand || '', price: '', link: '',
              source: 'from_closet', closetItemId: closetMatch.id,
            };
          }
        }

        // ═══ LEVEL 2: CACHED PRODUCTS DB ═══
        let cached = await prisma.cachedProduct.findMany({ where: { query: searchTerm }, take: 5 });

        if (cached.length === 0) {
          const keywords = searchTerm.split(' ').filter((w: string) => w.length > 3 && !['mens','womens'].includes(w.toLowerCase()));
          if (keywords.length > 0) {
            cached = await prisma.cachedProduct.findMany({
              where: { AND: keywords.slice(0, 2).map((word: string) => ({ title: { contains: word, mode: 'insensitive' as any } })) },
              take: 5,
            });
          }
        }
        
        if (cached.length === 0 && category !== 'unknown') {
          cached = await prisma.cachedProduct.findMany({ where: { category }, take: 10 });
          cached = cached.sort(() => 0.5 - Math.random());
        }

        if (cached.length > 0) {
          const best = cached[0];
          console.log(`    ✅ L2 CACHE: "${best.title}"`);
          return {
            type: q.type, category, name: q.name || best.title, reason: q.reason,
            imageUrl: best.thumbnail, title: best.title, brand: best.brand,
            price: best.price, link: best.link, source: 'from_cache',
          };
        }

        // ═══ LEVEL 3: LIVE SERPAPI ═══
        console.log(`    🌐 L3 SERPAPI: "${searchTerm}"...`);
        const { searchFashionProducts } = await import('../services/serpApiService');
        const apiResults = await searchFashionProducts(searchTerm);
        
        if (apiResults.length > 0) {
          try {
            await prisma.cachedProduct.createMany({
              data: apiResults.slice(0, 10).map((r: any) => ({
                query: searchTerm, category,
                title: r.title || '', brand: r.brand || '', price: r.price || '',
                thumbnail: r.thumbnail || '', link: r.link || '', source: r.source || '',
              })),
              skipDuplicates: true,
            });
            console.log(`    📦 Cached ${Math.min(apiResults.length, 10)} under "${category}"`);
          } catch (e) { /* non-fatal */ }

          const best = apiResults[0];
          console.log(`    ✅ L3 API: "${best.title}"`);
          return {
            type: q.type, category, name: q.name || best.title, reason: q.reason,
            imageUrl: best.thumbnail, title: best.title, brand: best.brand,
            price: best.price, link: best.link, source: 'from_api',
          };
        }

        // ═══ LEVEL 4: TYPE FALLBACK ═══
        const typeKw = q.type === 'top' ? 'shirt' : q.type === 'bottom' ? 'pants' : q.type === 'footwear' ? 'shoes' : 'watch';
        const fallback = await prisma.cachedProduct.findFirst({ where: { title: { contains: typeKw, mode: 'insensitive' as any } } });
        if (fallback) {
          console.log(`    ⚠️ L4 FALLBACK: "${fallback.title}"`);
          return {
            type: q.type, category, name: q.name || fallback.title, reason: q.reason,
            imageUrl: fallback.thumbnail, title: fallback.title, brand: fallback.brand,
            price: fallback.price, link: fallback.link, source: 'from_fallback',
          };
        }

        console.log(`    ✗ NO MATCH`);
        return { type: q.type, category, name: q.name, reason: q.reason, imageUrl: null, title: q.name, brand: '', price: '', link: '', source: 'none' };

      } catch (err: any) {
        console.error(`    ✗ ERROR: ${err.message}`);
        return { type: q.type, category, name: q.name, reason: q.reason, imageUrl: null, title: q.name, brand: '', price: '', link: '', source: 'error' };
      }
    }));

    const closetN = results.filter(r => r.source === 'from_closet').length;
    const cacheN = results.filter(r => r.source === 'from_cache').length;
    const apiN = results.filter(r => r.source === 'from_api').length;
    console.log(`\n✅ Pipeline Done: ${closetN} closet | ${cacheN} cache | ${apiN} API | ${results.filter(r => !r.imageUrl).length} missing\n`);
    
    res.json({ success: true, items: results });
  } catch (error: any) {
    console.error('❌ Outfit search pipeline failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
