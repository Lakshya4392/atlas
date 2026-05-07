// AI Stylist — Groq with multi-model fallback chain

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Fallback chain — tries each model in order until one works
const MODELS = [
  'llama-3.1-8b-instant',       // fast, separate quota
  'mixtral-8x7b-32768',         // different quota pool
  'gemma2-9b-it',               // Google's Gemma via Groq
  'llama3-8b-8192',             // older llama, separate limit
  'llama-3.3-70b-versatile',    // original (may be rate limited)
];

function buildPrompt(prompt: string, wardrobe: any[], weather: any, profile: any) {
  return {
    system: `You are the Alta Daily AI Fashion Stylist, expert in minimal luxury (Fear of God, Loro Piana aesthetic).
Return ONLY a raw JSON object — no markdown, no backticks, no explanation.

User Style: ${profile.style}
Weather: ${weather.temp}°C, ${weather.condition}
Wardrobe: ${JSON.stringify(wardrobe.map(w => ({ id: w.id, name: w.name, color: w.color, category: w.category })))}

Return this exact JSON shape:
{
  "outfit": [{ "id": "wardrobe_item_id", "reason": "why this piece" }],
  "stylingAdvice": "1-2 sentence styling tip",
  "weatherContext": "e.g. CHILLY & RAINY | 14°C",
  "idealAddition": "one luxury item not in their closet"
}

Rules: Only use IDs from Wardrobe. If empty wardrobe, return empty outfit array. Return ONLY JSON.`,
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
      temperature: 0.7,
      max_tokens: 512,
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
      outfit: [],
      stylingAdvice: 'Add your Groq API key to .env to get real AI styling suggestions!',
      weatherContext: 'API KEY MISSING',
      idealAddition: 'A GROQ API KEY — free at console.groq.com',
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
        continue; // try next model
      }
      // Non-rate-limit error — still try next
      console.warn(`⚠️ ${model} failed: ${e.message}, trying next...`);
      continue;
    }
  }

  // All models exhausted
  console.error('All Groq models rate limited or failed.');
  return JSON.stringify({
    outfit: [],
    stylingAdvice: 'All AI models are busy right now. Please try again in a few minutes.',
    weatherContext: 'ENGINE BUSY',
    idealAddition: 'TRY AGAIN IN 5 MIN',
  });
}
