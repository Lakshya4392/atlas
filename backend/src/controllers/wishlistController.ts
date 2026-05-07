import { Response } from 'express';
import Joi from 'joi';
import { AuthRequest } from '../middleware/auth';

// Mock wishlist data structure
interface WishlistItem {
  id: string;
  name: string;
  brand: string;
  price: string;
  image: string;
  category: string;
  saved: boolean;
  addedAt: Date;
}

// Mock data for now - in production this would be a database model
const mockWishlistItems: WishlistItem[] = [
  {
    id: 'w1',
    name: 'Merino Wool Coat',
    brand: 'Toteme',
    price: '€890',
    image: '🧥',
    category: 'outerwear',
    saved: true,
    addedAt: new Date()
  },
  {
    id: 'w2',
    name: 'Leather Loafers',
    brand: 'Gucci',
    price: '€650',
    image: '👞',
    category: 'shoes',
    saved: true,
    addedAt: new Date()
  }
];

const wishlistItemSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  brand: Joi.string().max(50).optional(),
  price: Joi.string().max(20).optional(),
  image: Joi.string().optional(),
  category: Joi.string().valid('tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories').optional()
});

export const getWishlist = async (req: AuthRequest, res: Response) => {
  try {
    // In production, filter by user ID
    // const userId = req.user._id;
    // const items = await WishlistItem.find({ user: userId });

    res.json({
      success: true,
      data: mockWishlistItems
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist'
    });
  }
};

export const addToWishlist = async (req: AuthRequest, res: Response) => {
  try {
    // Validate input
    const { error, value } = wishlistItemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Create new wishlist item
    const newItem: WishlistItem = {
      id: `w${Date.now()}`,
      ...value,
      saved: true,
      addedAt: new Date()
    };

    // In production: save to database
    mockWishlistItems.push(newItem);

    res.status(201).json({
      success: true,
      message: 'Item added to wishlist',
      data: newItem
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to wishlist'
    });
  }
};

export const removeFromWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // In production: remove from database
    const index = mockWishlistItems.findIndex(item => item.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in wishlist'
      });
    }

    mockWishlistItems.splice(index, 1);

    res.json({
      success: true,
      message: 'Item removed from wishlist'
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from wishlist'
    });
  }
};

export const toggleSaved = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // In production: update in database
    const item = mockWishlistItems.find(item => item.id === id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in wishlist'
      });
    }

    item.saved = !item.saved;

    res.json({
      success: true,
      message: `Item ${item.saved ? 'saved' : 'unsaved'}`,
      data: item
    });
  } catch (error) {
    console.error('Toggle saved error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle saved status'
    });
  }
};