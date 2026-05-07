import { Response } from 'express';
import Joi from 'joi';
import ClothingItem from '../models/ClothingItem';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { uploadToCloudinary } from '../utils/cloudinary';
import { Op } from 'sequelize';

const itemSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  category: Joi.string().valid('tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories').required(),
  subcategory: Joi.string().optional(),
  brand: Joi.string().max(50).optional(),
  color: Joi.string().required(),
  colorHex: Joi.string().pattern(/^#[0-9A-F]{6}$/i).required(),
  size: Joi.string().optional(),
  material: Joi.string().max(100).optional(),
  purchaseDate: Joi.date().optional(),
  purchasePrice: Joi.number().min(0).optional(),
  condition: Joi.string().valid('new', 'excellent', 'good', 'fair', 'poor').default('good'),
  tags: Joi.array().items(Joi.string().max(30)).default([]),
  season: Joi.array().items(Joi.string().valid('spring', 'summer', 'fall', 'winter')).default([]),
  occasions: Joi.array().items(Joi.string().max(50)).default([]),
  notes: Joi.string().max(500).optional(),
  favorite: Joi.boolean().default(false)
});

export const getWardrobe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const {
      category,
      favorite,
      page = 1,
      limit = 20,
      sort = 'createdAt'
    } = req.query;

    const where: any = { userId };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (favorite === 'true') {
      where.favorite = true;
    }

    // Handle sort order
    const order: any[] = [];
    if (sort === '-createdAt') {
      order.push(['createdAt', 'DESC']);
    } else if (sort === 'createdAt') {
      order.push(['createdAt', 'ASC']);
    } else if (sort === '-updatedAt') {
      order.push(['updatedAt', 'DESC']);
    } else {
      order.push(['createdAt', 'DESC']); // default
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const { count, rows: items } = await ClothingItem.findAndCountAll({
      where,
      order,
      limit: parseInt(limit as string),
      offset
    });

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: count,
          pages: Math.ceil(count / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    console.error('Get wardrobe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wardrobe'
    });
  }
};

export const getItemById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const item = await ClothingItem.findOne({
      where: { id, userId }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch item'
    });
  }
};

export const addItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    // Validate input
    const { error, value } = itemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Handle image uploads
    let imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer, 'wardrobe');
        imageUrls.push(url);
      }
    }

    // Create item
    const item = await ClothingItem.create({
      ...value,
      userId,
      images: imageUrls,
      wearCount: 0
    });

    // Update user stats
    const user = await User.findById(userId);
    if (user) {
      user.wardrobeStats.totalItems += 1;
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Item added successfully',
      data: item
    });
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item'
    });
  }
};

export const updateItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Validate input
    const { error, value } = itemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Handle image uploads
    let imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer, 'wardrobe');
        imageUrls.push(url);
      }
    }

    const updateData = {
      ...value,
      ...(imageUrls.length > 0 && { images: imageUrls })
    };

    const [affectedRows, [item]] = await ClothingItem.update(updateData, {
      where: { id, userId },
      returning: true
    });

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: item
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update item'
    });
  }
};

export const deleteItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const item = await ClothingItem.findOne({
      where: { id, userId }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    await item.destroy();

    // Update user stats
    const user = await User.findById(userId);
    if (user && user.wardrobeStats.totalItems > 0) {
      user.wardrobeStats.totalItems -= 1;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete item'
    });
  }
};

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    const categories = await ClothingItem.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          items: { $push: '$$ROOT' }
        }
      },
      {
        $project: {
          id: '$_id',
          name: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'tops'] }, then: 'Tops' },
                { case: { $eq: ['$_id', 'bottoms'] }, then: 'Bottoms' },
                { case: { $eq: ['$_id', 'dresses'] }, then: 'Dresses' },
                { case: { $eq: ['$_id', 'outerwear'] }, then: 'Outerwear' },
                { case: { $eq: ['$_id', 'shoes'] }, then: 'Shoes' },
                { case: { $eq: ['$_id', 'accessories'] }, then: 'Accessories' }
              ],
              default: 'Unknown'
            }
          },
          icon: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'tops'] }, then: 'shirt-outline' },
                { case: { $eq: ['$_id', 'bottoms'] }, then: 'resize-outline' },
                { case: { $eq: ['$_id', 'dresses'] }, then: 'flower-outline' },
                { case: { $eq: ['$_id', 'outerwear'] }, then: 'cloudy-outline' },
                { case: { $eq: ['$_id', 'shoes'] }, then: 'footsteps-outline' },
                { case: { $eq: ['$_id', 'accessories'] }, then: 'watch-outline' }
              ],
              default: 'help-outline'
            }
          },
          count: 1
        }
      },
      { $sort: { name: 1 } }
    ]);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
};

export const searchItems = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const items = await ClothingItem.find({
      user: userId,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
        { color: { $regex: q, $options: 'i' } }
      ]
    }).limit(20);

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
};

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    const stats = await ClothingItem.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalValue: { $sum: '$purchasePrice' },
          averageWearCount: { $avg: '$wearCount' },
          mostWornItem: { $max: '$wearCount' },
          categories: {
            $push: '$category'
          },
          brands: {
            $push: '$brand'
          }
        }
      }
    ]);

    const categoryBreakdown = await ClothingItem.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalItems: 0,
          totalValue: 0,
          averageWearCount: 0,
          mostWornItem: 0
        },
        categoryBreakdown,
        recentItems: await ClothingItem.find({ user: userId })
          .sort('-createdAt')
          .limit(5)
          .select('name category images wearCount')
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