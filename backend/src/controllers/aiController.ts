import { Response } from 'express';
import OpenAI from 'openai';
import AIChat from '../models/AIChat';
import Outfit from '../models/Outfit';
import ClothingItem from '../models/ClothingItem';
import { AuthRequest } from '../middleware/auth';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const chat = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { message, chatId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get or create active chat
    let chat = chatId
      ? await AIChat.findOne({ _id: chatId, user: userId })
      : await AIChat.getActiveChat(userId);

    if (!chat) {
      chat = await AIChat.createNewChat(userId);
    }

    // Get user's wardrobe context
    const wardrobeItems = await ClothingItem.find({ user: userId })
      .select('name category color brand tags')
      .limit(50);

    const recentOutfits = await Outfit.find({ user: userId })
      .sort('-createdAt')
      .limit(5)
      .populate('items', 'name category color');

    // Prepare AI context
    const systemPrompt = `You are ALTA, a sophisticated AI fashion stylist. You help users create perfect outfits from their existing wardrobe.

WARDROBE CONTEXT:
${wardrobeItems.map(item =>
  `- ${item.name} (${item.category}, ${item.color}, ${item.brand || 'No brand'})`
).join('\n')}

RECENT OUTFITS:
${recentOutfits.map(outfit =>
  `- ${outfit.name}: ${outfit.items.map(item => (item as any).name).join(', ')}`
).join('\n')}

INSTRUCTIONS:
- Suggest outfits using only items from their wardrobe
- Be helpful, stylish, and conversational
- Consider weather, occasion, and personal style
- Keep suggestions practical and wearable
- Ask clarifying questions when needed
- Use the user's existing items creatively

Respond naturally and help them look their best!`;

    // Add user message to chat
    chat.addMessage('user', message);

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...chat.getRecentMessages(10).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, I couldn\'t generate a response right now.';

    // Add AI response to chat
    await chat.addMessage('assistant', aiResponse);

    res.json({
      success: true,
      data: {
        chatId: chat._id,
        message: aiResponse,
        chat: {
          id: chat._id,
          messages: chat.messages.slice(-2), // Return last 2 messages
          lastActivity: chat.lastActivity
        }
      }
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message'
    });
  }
};

export const generateOutfit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { occasion, weather, preferences } = req.body;

    // Get wardrobe items
    const wardrobeItems = await ClothingItem.find({ user: userId })
      .select('name category color colorHex brand tags season occasions');

    if (wardrobeItems.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'You need at least 3 items in your wardrobe to generate outfits'
      });
    }

    const prompt = `Create a complete outfit for: ${occasion || 'casual day'}
Weather: ${weather || 'moderate'}
User preferences: ${preferences || 'versatile and comfortable'}

Available items:
${wardrobeItems.map(item =>
  `${item.category.toUpperCase()}: ${item.name} (${item.color}, ${item.brand || 'no brand'})`
).join('\n')}

Return ONLY a JSON object with this exact structure:
{
  "name": "Outfit Name",
  "description": "Brief description",
  "items": ["item_id_1", "item_id_2", "item_id_3"],
  "reasoning": "Why this outfit works"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a fashion stylist creating outfits from existing wardrobes. Return only valid JSON.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.8
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    // Parse AI response
    const outfitData = JSON.parse(response.replace(/```json\n?|\n?```/g, ''));

    // Validate and create outfit
    const itemIds = outfitData.items;
    const validItems = await ClothingItem.find({
      _id: { $in: itemIds },
      user: userId
    });

    if (validItems.length !== itemIds.length) {
      throw new Error('Some items not found in user wardrobe');
    }

    const outfit = new Outfit({
      user: userId,
      name: outfitData.name,
      description: outfitData.description,
      occasion,
      weather,
      items: validItems.map(item => item._id),
      aiGenerated: true,
      aiPrompt: prompt,
      rating: 0,
      favorite: false,
      wearCount: 0
    });

    await outfit.save();

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'wardrobeStats.totalOutfits': 1 }
    });

    res.json({
      success: true,
      message: 'Outfit generated successfully',
      data: {
        outfit: await Outfit.findById(outfit._id).populate('items'),
        reasoning: outfitData.reasoning
      }
    });
  } catch (error) {
    console.error('Generate outfit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate outfit'
    });
  }
};

export const getChatHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const chats = await AIChat.find({ user: userId })
      .sort('-lastActivity')
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .select('title messages lastActivity isActive createdAt');

    res.json({
      success: true,
      data: chats
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history'
    });
  }
};