import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

// Initialize the Gemini SDK. If key is missing, we will catch it in the function.
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || 'dummy_key');

export async function generateOutfitSuggestion(
  prompt: string, 
  wardrobe: any[], 
  weather: any, 
  profile: any
): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.warn("No EXPO_PUBLIC_GEMINI_API_KEY found. Falling back to mock AI response.");
    return "This is a mock AI response. Please add your Gemini API key to the .env file to see real suggestions based on your wardrobe: " + wardrobe.map(w => w.name).join(', ');
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `
You are the Alta Daily AI Fashion Stylist, an expert in minimal luxury (Fear of God, Loro Piana aesthetic).
You MUST return your response as a RAW JSON object.

User Style Preference: ${profile.style}
Current Weather: ${weather.temp}°C, ${weather.condition}
Available Wardrobe Items: ${JSON.stringify(wardrobe.map(w => ({ id: w.id, name: w.name, color: w.color, category: w.category })))}

JSON Schema:
{
  "outfit": [
    { "id": "item_id_from_wardrobe", "reason": "why this piece" }
  ],
  "stylingAdvice": "concise styling tip",
  "weatherContext": "brief weather mention (e.g., CHILLY & RAINY | 14°C)",
  "idealAddition": "one high-end item not in their closet that would perfect the look"
}

IMPORTANT: 
1. Use ONLY the IDs from the 'Available Wardrobe Items' list.
2. If the wardrobe is empty, suggest a hypothetical outfit but return empty 'id' fields.
3. Return ONLY the JSON. No markdown backticks.
    `;

    const result = await model.generateContent(systemPrompt + "\nUser request: " + prompt);
    const responseText = result.response.text().trim();
    
    // Attempt to extract JSON even if Gemini adds backticks
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : responseText;
  } catch (e) {
    console.error("Gemini AI API failed:", e);
    return "I'm currently unable to access the styling engine. Please try again later.";
  }
}
