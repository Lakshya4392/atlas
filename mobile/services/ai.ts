// AI Stylist — Groq with multi-model fallback chain
// v2: Occasion-aware, distinct outfits, closet-first priority hints

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MODELS = [
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
  'llama3-8b-8192',
  'llama-3.3-70b-versatile',
];

function buildPrompt(prompt: string, wardrobe: any[], weather: any, profile: any) {
  const gender = profile.wearPreference || 'Men';
  const genderPrefix = gender.toLowerCase().includes('women') ? "womens" : "mens";
  
  // Build a concise wardrobe summary for the AI
  const wardrobeSummary = wardrobe.length > 0 
    ? wardrobe.map(w => `[${w.id}] ${w.name} (${w.category}, ${w.color})`).join('\n')
    : 'User has no items in their closet yet.';

  return {
    system: `You are the Alta Daily AI Fashion Stylist. You create complete, cohesive outfits.

═══ CONTEXT ═══
Gender: ${gender}
Weather: ${weather.temp}°C, ${weather.condition}
User's Closet Items:
${wardrobeSummary}

═══ YOUR TASK ═══
Based on the user's request, generate EXACTLY 3 DISTINCT outfits.

Each outfit MUST have EXACTLY 4 items:
1. TOP — shirt, t-shirt, polo, blouse, hoodie, sweater, jacket
2. BOTTOM — pants, jeans, chinos, skirt, shorts, trousers  
3. FOOTWEAR — sneakers, loafers, boots, heels, sandals, oxfords
4. ACCESSORY — watch, bag, sunglasses, belt, necklace, hat, scarf

═══ CRITICAL RULES ═══

1. UNDERSTAND THE OCCASION:
   - "business meeting" → formal: dress shirts, trousers, loafers, watches
   - "casual hangout" → relaxed: t-shirts, jeans, sneakers, sunglasses
   - "date night" → stylish: fitted shirts, slim pants, Chelsea boots, perfume
   - "gym/workout" → athletic: tank tops, joggers, training shoes, headband
   - "beach/vacation" → tropical: linen shirts, shorts, sandals, straw hat

2. WEATHER ADAPTATION (currently ${weather.temp}°C):
   - Above 35°C → linen, cotton, breathable, light colors, no layers
   - 25-35°C → light fabrics, short sleeves OK, breathable shoes
   - 15-25°C → layering, light jackets, medium weight fabrics
   - Below 15°C → heavy layers, wool, boots, scarves, coats

3. THREE DISTINCT STYLES — each outfit MUST be a different vibe:
   - Outfit 1: Most formal/polished interpretation of the request
   - Outfit 2: A balanced/smart-casual middle ground
   - Outfit 3: Most relaxed/trendy interpretation

4. CLOSET PRIORITY:
   - If user has a matching item in their closet, use its ID in "closetItemId"
   - If no match exists, leave "closetItemId" as "" and provide a precise "searchQuery"

5. SEARCH QUERY RULES:
   - ALWAYS start with "${genderPrefix}"
   - Be VERY specific: color + material + style + fit
   - Example: "${genderPrefix} navy blue slim fit linen dress shirt"
   - NOT generic like "shirt" or "shoes"

═══ CATEGORY VALUES ═══
Use these exact category values: shirt, pants, shoes, watch, bag, sunglasses, jacket, jewelry, belt, hat, shorts, skirt, dress

═══ JSON FORMAT — Return ONLY this (no markdown, no backticks) ═══
{
  "outfits": [
    {
      "name": "Outfit Name",
      "occasion": "formal / smart casual / casual / athletic / vacation",
      "items": [
        {
          "type": "top",
          "category": "shirt",
          "name": "Light Blue Linen Shirt",
          "closetItemId": "",
          "searchQuery": "${genderPrefix} light blue linen dress shirt slim fit",
          "reason": "Breathable linen perfect for ${weather.temp}°C heat"
        }
      ],
      "stylingAdvice": "1-2 sentence tip for pulling this look together"
    }
  ]
}`,
    user: prompt,
  };
}

async function callGroq(model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.85,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    const isRateLimit = response.status === 429;
    throw { isRateLimit, message: err?.error?.message || `HTTP ${response.status}` };
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim() || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : text;
}

export async function generateOutfitSuggestion(
  prompt: string,
  wardrobe: any[],
  weather: any,
  profile: any
): Promise<string> {
  if (!GROQ_API_KEY) {
    return JSON.stringify({
      outfits: [],
      stylingAdvice: 'Add your Groq API key to .env to get real AI styling suggestions!',
    });
  }

  const { system, user } = buildPrompt(prompt, wardrobe, weather, profile);

  for (const model of MODELS) {
    try {
      console.log(`Trying Groq model: ${model}...`);
      const result = await callGroq(model, system, user);
      console.log(`✅ Success with ${model}`);
      return result;
    } catch (e: any) {
      if (e.isRateLimit) {
        console.warn(`⚠️ ${model} rate limited, trying next...`);
        continue;
      }
      console.warn(`⚠️ ${model} failed: ${e.message}, trying next...`);
      continue;
    }
  }

  console.error('All Groq models rate limited or failed.');
  return JSON.stringify({
    outfits: [],
    stylingAdvice: 'All AI models are busy right now. Please try again in a few minutes.',
  });
}
