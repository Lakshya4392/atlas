import { Response } from 'express';
import ClothingItem from '../models/ClothingItem';
import Outfit from '../models/Outfit';
import { AuthRequest } from '../middleware/auth';

export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    // Wardrobe analytics
    const totalItems = await ClothingItem.countDocuments({ user: userId });
    const favoriteItems = await ClothingItem.countDocuments({ user: userId, favorite: true });
    const totalValue = await ClothingItem.aggregate([
      { $match: { user: userId, purchasePrice: { $exists: true } } },
      { $group: { _id: null, total: { $sum: '$purchasePrice' } } }
    ]);

    // Outfit analytics
    const totalOutfits = await Outfit.countDocuments({ user: userId });
    const aiGeneratedOutfits = await Outfit.countDocuments({ user: userId, aiGenerated: true });

    // Wear analytics
    const mostWorn = await ClothingItem.find({ user: userId })
      .sort('-wearCount')
      .limit(5)
      .select('name wearCount category');

    const recentWear = await ClothingItem.find({
      user: userId,
      lastWorn: { $exists: true }
    })
      .sort('-lastWorn')
      .limit(10)
      .select('name lastWorn wearCount');

    // Category breakdown
    const categoryStats = await ClothingItem.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          wearCount: { $sum: '$wearCount' },
          favorites: { $sum: { $cond: ['$favorite', 1, 0] } }
        }
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          wearCount: 1,
          favorites: 1,
          avgWearCount: { $divide: ['$wearCount', '$count'] }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalItems,
          favoriteItems,
          totalOutfits,
          aiGeneratedOutfits,
          totalValue: totalValue[0]?.total || 0
        },
        mostWorn,
        recentWear,
        categoryStats,
        insights: generateInsights(categoryStats, totalItems, totalOutfits)
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
};

export const getWearPatterns = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { period = 'month' } = req.query; // month, quarter, year

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Wear patterns by day of week
    const weeklyPatterns = await ClothingItem.aggregate([
      { $match: { user: userId, lastWorn: { $gte: startDate } } },
      {
        $group: {
          _id: { $dayOfWeek: '$lastWorn' },
          wears: { $sum: '$wearCount' },
          items: { $sum: 1 }
        }
      },
      {
        $project: {
          dayOfWeek: '$_id',
          wears: 1,
          items: 1,
          avgWears: { $divide: ['$wears', '$items'] }
        }
      },
      { $sort: { dayOfWeek: 1 } }
    ]);

    // Wear patterns by category
    const categoryPatterns = await ClothingItem.aggregate([
      { $match: { user: userId, lastWorn: { $gte: startDate } } },
      {
        $group: {
          _id: '$category',
          wears: { $sum: '$wearCount' },
          items: { $push: { name: '$name', wears: '$wearCount', lastWorn: '$lastWorn' } }
        }
      },
      { $sort: { wears: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        period,
        weeklyPatterns,
        categoryPatterns,
        insights: analyzeWearPatterns(weeklyPatterns, categoryPatterns)
      }
    });
  } catch (error) {
    console.error('Get wear patterns error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wear patterns'
    });
  }
};

export const getStyleInsights = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    // Color preferences
    const colorStats = await ClothingItem.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$color',
          count: { $sum: 1 },
          wearCount: { $sum: '$wearCount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Brand preferences
    const brandStats = await ClothingItem.aggregate([
      { $match: { user: userId, brand: { $ne: null } } },
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 },
          wearCount: { $sum: '$wearCount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Seasonal preferences
    const seasonStats = await ClothingItem.aggregate([
      { $match: { user: userId } },
      { $unwind: '$season' },
      {
        $group: {
          _id: '$season',
          count: { $sum: 1 }
        }
      }
    ]);

    // Outfit ratings analysis
    const outfitRatings = await Outfit.aggregate([
      { $match: { user: userId, rating: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalRated: { $sum: 1 },
          ratings: { $push: '$rating' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        colorPreferences: colorStats,
        brandPreferences: brandStats,
        seasonalPreferences: seasonStats,
        outfitRatings: outfitRatings[0] || { avgRating: 0, totalRated: 0 },
        recommendations: generateStyleRecommendations(colorStats, brandStats, seasonStats)
      }
    });
  } catch (error) {
    console.error('Get style insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch style insights'
    });
  }
};

// Helper functions
function generateInsights(categoryStats: any[], totalItems: number, totalOutfits: number) {
  const insights = [];

  if (totalItems < 10) {
    insights.push({
      type: 'warning',
      title: 'Expand Your Wardrobe',
      description: 'Add more items to get better outfit suggestions from AI.'
    });
  }

  const mostWornCategory = categoryStats.find(cat => cat.category === 'tops');
  if (mostWornCategory && mostWornCategory.avgWearCount > 5) {
    insights.push({
      type: 'info',
      title: 'High Rotation Items',
      description: `Your ${mostWornCategory.category} get worn frequently. Consider versatile basics.`
    });
  }

  if (totalOutfits === 0) {
    insights.push({
      type: 'suggestion',
      title: 'Create Your First Outfit',
      description: 'Start building outfits to track your style evolution.'
    });
  }

  return insights;
}

function analyzeWearPatterns(weeklyPatterns: any[], categoryPatterns: any[]) {
  const insights = [];

  const highestWearDay = weeklyPatterns.reduce((max, day) =>
    day.wears > max.wears ? day : max, weeklyPatterns[0]);

  if (highestWearDay) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    insights.push({
      type: 'pattern',
      title: 'Peak Wear Day',
      description: `You wear clothes most on ${dayNames[highestWearDay.dayOfWeek - 1]}s.`
    });
  }

  const mostWornCategory = categoryPatterns[0];
  if (mostWornCategory) {
    insights.push({
      type: 'category',
      title: 'Most Worn Category',
      description: `${mostWornCategory._id} are your most frequently worn items.`
    });
  }

  return insights;
}

function generateStyleRecommendations(colorStats: any[], brandStats: any[], seasonStats: any[]) {
  const recommendations = [];

  const favoriteColor = colorStats[0];
  if (favoriteColor) {
    recommendations.push({
      type: 'color',
      title: `More ${favoriteColor._id} Items`,
      description: `Consider adding more ${favoriteColor._id} pieces to match your color preferences.`
    });
  }

  const favoriteBrand = brandStats[0];
  if (favoriteBrand && favoriteBrand.count > 2) {
    recommendations.push({
      type: 'brand',
      title: `${favoriteBrand._id} Fan`,
      description: `You have ${favoriteBrand.count} items from ${favoriteBrand._id}. Explore their new collection!`
    });
  }

  const seasonalGaps = ['spring', 'summer', 'fall', 'winter'].filter(season =>
    !seasonStats.find(s => s._id === season) || seasonStats.find(s => s._id === season).count < 3
  );

  if (seasonalGaps.length > 0) {
    recommendations.push({
      type: 'seasonal',
      title: 'Seasonal Wardrobe Gaps',
      description: `Consider adding items for: ${seasonalGaps.join(', ')}`
    });
  }

  return recommendations;
}