import { Request, Response } from 'express';
import prisma from '../config/prisma';

// ── Get User Stats ──
export const getStats = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const [user, clothesCount, outfitsCount, favorites] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.clothingItem.count({ where: { userId } }),
      prisma.outfit.count({ where: { userId } }),
      prisma.clothingItem.count({ where: { userId, favorite: true } }),
    ]);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({
      success: true,
      stats: {
        clothesCount,
        outfitsCount,
        favoritesCount: favorites,
        streak: user.streak,
        level: user.level,
        style: user.style,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ── Update Avatar ──
export const updateAvatar = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { avatarUrl } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { avatar: avatarUrl } as any,
    });
    res.json({ success: true, user });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ success: false, error: 'Failed to update avatar' });
  }
};

// ── Update Preferred Brands ──
export const updateBrands = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { brands } = req.body;
  
  if (!Array.isArray(brands)) {
    return res.status(400).json({ success: false, error: 'brands must be an array of strings' });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { preferredBrands: brands },
    });
    res.json({ success: true, user });
  } catch (error: any) {
    console.error('Update brands error:', error);
    res.status(500).json({ success: false, error: 'Failed to update preferred brands' });
  }
};

// ── Complete Onboarding ──
export const completeOnboarding = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { occupation, wearPreference, hearSource, brands } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { 
        ...(occupation !== undefined && { occupation }),
        ...(wearPreference !== undefined && { wearPreference }),
        ...(hearSource !== undefined && { hearSource }),
        ...(brands && { preferredBrands: brands })
      },
    });
    res.json({ success: true, user });
  } catch (error: any) {
    console.error('Update onboarding error:', error);
    res.status(500).json({ success: false, error: 'Failed to save onboarding data' });
  }
};
