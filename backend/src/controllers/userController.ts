import { Response } from 'express';
import Joi from 'joi';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { uploadToCloudinary } from '../utils/cloudinary';

const profileSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  bio: Joi.string().max(500).allow(''),
  stylePreferences: Joi.array().items(Joi.string())
});

const settingsSchema = Joi.object({
  notifications: Joi.boolean(),
  weatherSuggestions: Joi.boolean(),
  aiSuggestions: Joi.boolean(),
  theme: Joi.string().valid('light', 'dark', 'system'),
  language: Joi.string().max(5)
});

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    // Validate input
    const { error, value } = profileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const updateData: any = { ...value };

    // Handle avatar upload
    if (req.file) {
      const avatarUrl = await uploadToCloudinary(req.file.buffer, 'avatars');
      updateData.avatar = avatarUrl;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    // Validate input
    const { error, value } = settingsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { settings: value },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: user.settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
};

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate additional stats
    const wardrobeItems = await ClothingItem.countDocuments({ user: userId });
    const totalOutfits = await Outfit.countDocuments({ user: userId });
    const favoriteItems = await ClothingItem.countDocuments({ user: userId, favorite: true });

    // Most worn items
    const mostWorn = await ClothingItem.find({ user: userId })
      .sort('-wearCount')
      .limit(5)
      .select('name wearCount category');

    // Recent activity
    const recentOutfits = await Outfit.find({ user: userId })
      .sort('-lastWorn')
      .limit(3)
      .select('name lastWorn');

    res.json({
      success: true,
      data: {
        wardrobeStats: {
          ...user.wardrobeStats,
          totalItems: wardrobeItems,
          totalOutfits: totalOutfits,
          favoriteItems
        },
        mostWorn,
        recentOutfits,
        currentStreak: user.wardrobeStats.currentStreak,
        longestStreak: user.wardrobeStats.longestStreak
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
};