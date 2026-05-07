import { Response } from 'express';
import Joi from 'joi';
import Outfit from '../models/Outfit';
import ClothingItem from '../models/ClothingItem';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

const outfitSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  occasion: Joi.string().min(1).max(50).required(),
  weather: Joi.string().max(50).optional(),
  season: Joi.string().valid('spring', 'summer', 'fall', 'winter').optional(),
  items: Joi.array().items(Joi.string().hex().length(24)).min(1).required(),
  tags: Joi.array().items(Joi.string().max(30)).default([]),
  favorite: Joi.boolean().default(false),
  notes: Joi.string().max(500).optional()
});

export const getOutfits = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const {
      occasion,
      favorite,
      aiGenerated,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    const query: any = { user: userId };

    if (occasion) {
      query.occasion = { $regex: occasion, $options: 'i' };
    }

    if (favorite === 'true') {
      query.favorite = true;
    }

    if (aiGenerated !== undefined) {
      query.aiGenerated = aiGenerated === 'true';
    }

    const outfits = await Outfit.find(query)
      .populate('items', 'name category color colorHex images')
      .sort(sort as string)
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string));

    const total = await Outfit.countDocuments(query);

    res.json({
      success: true,
      data: {
        outfits,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    console.error('Get outfits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch outfits'
    });
  }
};

export const getOutfitById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const outfit = await Outfit.findOne({ _id: id, user: userId })
      .populate('items', 'name category color colorHex brand images tags');

    if (!outfit) {
      return res.status(404).json({
        success: false,
        message: 'Outfit not found'
      });
    }

    res.json({
      success: true,
      data: outfit
    });
  } catch (error) {
    console.error('Get outfit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch outfit'
    });
  }
};

export const createOutfit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    // Validate input
    const { error, value } = outfitSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Verify all items belong to user
    const itemIds = value.items;
    const userItems = await ClothingItem.find({
      _id: { $in: itemIds },
      user: userId
    });

    if (userItems.length !== itemIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some items do not belong to your wardrobe'
      });
    }

    // Create outfit
    const outfit = new Outfit({
      ...value,
      user: userId,
      aiGenerated: false,
      rating: 0,
      wearCount: 0
    });

    await outfit.save();

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'wardrobeStats.totalOutfits': 1 }
    });

    // Populate items for response
    await outfit.populate('items', 'name category color colorHex images');

    res.status(201).json({
      success: true,
      message: 'Outfit created successfully',
      data: outfit
    });
  } catch (error) {
    console.error('Create outfit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create outfit'
    });
  }
};

export const updateOutfit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Validate input
    const { error, value } = outfitSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Verify all items belong to user
    const itemIds = value.items;
    const userItems = await ClothingItem.find({
      _id: { $in: itemIds },
      user: userId
    });

    if (userItems.length !== itemIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some items do not belong to your wardrobe'
      });
    }

    const outfit = await Outfit.findOneAndUpdate(
      { _id: id, user: userId },
      value,
      { new: true }
    ).populate('items', 'name category color colorHex images');

    if (!outfit) {
      return res.status(404).json({
        success: false,
        message: 'Outfit not found'
      });
    }

    res.json({
      success: true,
      message: 'Outfit updated successfully',
      data: outfit
    });
  } catch (error) {
    console.error('Update outfit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update outfit'
    });
  }
};

export const deleteOutfit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const outfit = await Outfit.findOneAndDelete({ _id: id, user: userId });

    if (!outfit) {
      return res.status(404).json({
        success: false,
        message: 'Outfit not found'
      });
    }

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'wardrobeStats.totalOutfits': -1 }
    });

    res.json({
      success: true,
      message: 'Outfit deleted successfully'
    });
  } catch (error) {
    console.error('Delete outfit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete outfit'
    });
  }
};

export const wearOutfit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const outfit = await Outfit.findOne({ _id: id, user: userId });

    if (!outfit) {
      return res.status(404).json({
        success: false,
        message: 'Outfit not found'
      });
    }

    // Increment wear count for outfit
    await outfit.wear();

    // Increment wear count for each item in the outfit
    await ClothingItem.updateMany(
      { _id: { $in: outfit.items }, user: userId },
      { $inc: { wearCount: 1 }, lastWorn: new Date() }
    );

    res.json({
      success: true,
      message: 'Outfit wear logged successfully'
    });
  } catch (error) {
    console.error('Wear outfit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log outfit wear'
    });
  }
};

export const rateOutfit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { rating } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const outfit = await Outfit.findOneAndUpdate(
      { _id: id, user: userId },
      { rating },
      { new: true }
    );

    if (!outfit) {
      return res.status(404).json({
        success: false,
        message: 'Outfit not found'
      });
    }

    res.json({
      success: true,
      message: 'Rating updated successfully',
      data: outfit
    });
  } catch (error) {
    console.error('Rate outfit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate outfit'
    });
  }
};