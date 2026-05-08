const dotenv = require('dotenv');
dotenv.config();

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function testAI() {
  if (!GROQ_API_KEY) {
    console.error('No EXPO_PUBLIC_GROQ_API_KEY found in .env');
    return;
  }

  const wardrobe = [
    { id: '1', name: 'Black Denim Jacket', color: 'Black', category: 'Outerwear' },
    { id: '2', name: 'White T-Shirt', color: 'White', category: 'Top' },
    { id: '3', name: 'Blue Jeans', color: 'Blue', category: 'Bottom' },
    { id: '4', name: 'White Sneakers', color: 'White', category: 'Shoes' },
    { id: '5', name: 'Grey Hoodie', color: 'Grey', category: 'Top' },
    { id: '6', name: 'Black Joggers', color: 'Black', category: 'Bottom' },
    { id: '7', name: 'Black Boots', color: 'Black', category: 'Shoes' },
  ];

  const weather = { temp: 15, condition: 'Cloudy & Breezy' };
  const profile = { style: 'Minimalist Streetwear' };
  const prompt = 'Style me for today';

  const systemPrompt = `You are the Alta Daily AI Fashion Stylist, expert in minimal luxury.
Return ONLY a raw JSON object — no markdown, no backticks, no explanation.

User Style: ${profile.style}
Weather: ${weather.temp}°C, ${weather.condition}
Wardrobe: ${JSON.stringify(wardrobe)}

Return this exact JSON shape:
{
  "outfits": [
    {
      "name": "Look Name",
      "items": [{ "id": "wardrobe_item_id", "reason": "why this piece" }],
      "stylingAdvice": "1-2 sentence styling tip"
    }
  ],
  "weatherContext": "e.g. CHILLY & RAINY | 14°C",
  "idealAddition": "one luxury item not in their closet"
}

Rules: Generate EXACTLY 3 distinct outfits. Each outfit MUST contain 3 to 4 items (e.g. Top, Bottom, Footwear). You MUST base your choices strictly on the current Weather: ${weather.temp}°C, ${weather.condition}. Only use IDs from Wardrobe. Return ONLY JSON.`;

  console.log('Sending request to Groq...');
  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    const data = await res.json();
    console.log('--- RAW RESPONSE ---');
    console.log(data.choices[0].message.content);
    
    console.log('--- PARSE TEST ---');
    const parsed = JSON.parse(data.choices[0].message.content);
    console.log(`Successfully generated ${parsed.outfits.length} outfits!`);
    console.log(`Weather Context: ${parsed.weatherContext}`);
  } catch (e) {
    console.error('Failed!', e);
  }
}

testAI();
