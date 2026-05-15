// ── AI Garment Tagging Service ──
// Uses Groq Vision (Llama 4 Scout) to tag clothing items

export async function aiTagGarment(imageUrl: string): Promise<{ name: string; category: string; color: string; brand: string }> {
  const GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!GROQ_KEY) {
    console.log('   ⚠️ No Groq key, using fallback tags');
    return { name: 'Clothing Item', category: 'tops', color: 'Unknown', brand: 'Unknown' };
  }

  try {
    console.log('   🔗 Calling Groq Vision API...');
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
              {
                type: 'text',
                text: `You are a fashion AI. Analyze this clothing item image and return ONLY a valid JSON object with these exact keys:
{
  "name": "descriptive name of the garment, e.g. 'Navy Blue Slim Fit Chinos'",
  "category": "one of: tops, bottoms, outerwear, shoes, accessories, dresses, activewear",
  "color": "primary color, e.g. 'Navy Blue'",
  "brand": "brand name if visible, otherwise 'Unknown'"
}
Return ONLY the JSON, no markdown, no explanation.`
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error(`   ⚠️ Groq HTTP ${groqRes.status}: ${errBody.substring(0, 200)}`);
      throw new Error('Groq API failed');
    }

    const groqData = await groqRes.json() as any;
    const text = groqData?.choices?.[0]?.message?.content || '';
    console.log(`   📝 Groq response: ${text.substring(0, 150)}`);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e: any) {
    console.error('   ⚠️ Groq tagging failed:', e.message);
  }
  return { name: 'Clothing Item', category: 'tops', color: 'Unknown', brand: 'Unknown' };
}
