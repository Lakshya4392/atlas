import { Response } from 'express';
import Joi from 'joi';
import Trip from '../models/Trip';
import ClothingItem from '../models/ClothingItem';
import OpenAI from 'openai';
import { AuthRequest } from '../middleware/auth';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const tripSchema = Joi.object({
  destination: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  startDate: Joi.date().greater('now').required(),
  endDate: Joi.date().when('startDate', {
    is: Joi.exist(),
    then: Joi.date().greater(Joi.ref('startDate')),
    otherwise: Joi.date().greater('now')
  }).required(),
  weather: Joi.string().min(1).max(50).required(),
  temperature: Joi.number().min(-50).max(60).required(),
  notes: Joi.string().max(1000).optional()
});

export const getTrips = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { status, upcoming, page = 1, limit = 20 } = req.query;

    const query: any = { user: userId };

    if (status) {
      query.status = status;
    }

    if (upcoming === 'true') {
      query.startDate = { $gte: new Date() };
      query.status = { $in: ['planning', 'active'] };
    }

    const trips = await Trip.find(query)
      .sort('-startDate')
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string));

    const total = await Trip.countDocuments(query);

    res.json({
      success: true,
      data: {
        trips,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trips'
    });
  }
};

export const getTripById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const trip = await Trip.findOne({ _id: id, user: userId })
      .populate('packingList.item', 'name category color colorHex brand images');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trip'
    });
  }
};

export const createTrip = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    // Validate input
    const { error, value } = tripSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Create trip
    const trip = new Trip({
      ...value,
      user: userId,
      status: 'planning'
    });

    await trip.save();

    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      data: trip
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create trip'
    });
  }
};

export const updateTrip = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Validate input
    const { error, value } = tripSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const trip = await Trip.findOneAndUpdate(
      { _id: id, user: userId },
      value,
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.json({
      success: true,
      message: 'Trip updated successfully',
      data: trip
    });
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update trip'
    });
  }
};

export const deleteTrip = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const trip = await Trip.findOneAndDelete({ _id: id, user: userId });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.json({
      success: true,
      message: 'Trip deleted successfully'
    });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete trip'
    });
  }
};

export const generatePackingList = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const trip = await Trip.findOne({ _id: id, user: userId });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Get user's wardrobe
    const wardrobeItems = await ClothingItem.find({ user: userId })
      .select('name category color brand tags season occasions');

    if (wardrobeItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No wardrobe items found. Add some clothing items first.'
      });
    }

    const prompt = `Create a packing list for a trip to ${trip.destination}.

TRIP DETAILS:
- Duration: ${trip.duration} days
- Weather: ${trip.weather}, ${trip.temperature}°C
- Dates: ${trip.startDate.toDateString()} to ${trip.endDate.toDateString()}

WARDROBE ITEMS:
${wardrobeItems.map(item =>
  `${item.category.toUpperCase()}: ${item.name} (${item.color}, ${item.brand || 'no brand'}, tags: ${item.tags.join(', ') || 'none'})`
).join('\n')}

INSTRUCTIONS:
- Suggest 3-8 items total based on trip duration and weather
- Consider the season and occasion-appropriate clothing
- Include essentials like underwear, socks if applicable
- Return ONLY a JSON array of objects with this exact structure:
[
  {
    "itemId": "mongodb_id_of_item",
    "category": "tops|bottoms|dresses|outerwear|shoes|accessories",
    "reason": "Why this item is perfect for the trip"
  }
]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a travel stylist creating packing lists from existing wardrobes. Return only valid JSON arrays.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    // Parse AI response
    const packingList = JSON.parse(response.replace(/```json\n?|\n?```/g, ''));

    // Validate and create packing list
    const validatedPackingList = [];
    for (const item of packingList) {
      const wardrobeItem = wardrobeItems.find(w => w._id.toString() === item.itemId);
      if (wardrobeItem) {
        validatedPackingList.push({
          item: wardrobeItem._id,
          packed: false,
          category: item.category,
          aiSuggested: true
        });
      }
    }

    // Update trip
    trip.packingList = validatedPackingList;
    trip.aiGenerated = true;
    trip.aiPrompt = prompt;
    await trip.save();

    res.json({
      success: true,
      message: 'Packing list generated successfully',
      data: {
        trip: await Trip.findById(trip._id).populate('packingList.item', 'name category color colorHex images'),
        suggestions: packingList.map(item => item.reason)
      }
    });
  } catch (error) {
    console.error('Generate packing list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate packing list'
    });
  }
};

export const updatePackingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id, itemId } = req.params;
    const userId = req.user._id;
    const { packed } = req.body;

    if (typeof packed !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Packed status must be a boolean'
      });
    }

    await Trip.findOneAndUpdate(
      { _id: id, user: userId, 'packingList.item': itemId },
      { $set: { 'packingList.$.packed': packed } }
    );

    res.json({
      success: true,
      message: 'Packing status updated successfully'
    });
  } catch (error) {
    console.error('Update packing status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update packing status'
    });
  }
};