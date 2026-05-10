import fs from 'fs';
import 'dotenv/config';

// Aapke .env me HF_TOKEN hona zaroori hai
const HF_TOKEN = process.env.HF_TOKEN || process.env.HF_TOKEN_2 || process.env.HF_TOKEN_3;

if (!HF_TOKEN) {
  console.log('❌ HF_TOKEN nahi mila .env file me.');
  process.exit(1);
}

// Ye ek messy t-shirt ki test photo hai
const MESSY_SHIRT_URL = 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=500&auto=format&fit=crop'; 

async function testHFFlatLay() {
  console.log('══════════════════════════════════════════════════');
  console.log('👕 Messy Image to Perfect Flat-Lay (Hugging Face API)');
  console.log('══════════════════════════════════════════════════');
  console.log('\n📥 Fetching messy shirt image...');
  
  try {
    const res = await fetch(MESSY_SHIRT_URL);
    const imageBuffer = await res.arrayBuffer();

    console.log('🤖 Sending to Hugging Face Inference API (timbrooks/instruct-pix2pix)...');
    console.log('⏳ Model is recreating the image (Takes a few seconds)...');

    // Direct fetch to Hugging Face Inference API
    const response = await fetch(
        "https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix",
        {
            headers: { 
                Authorization: `Bearer ${HF_TOKEN}`,
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
                inputs: "make it a perfectly flat laid t-shirt on a pure white background, top down view",
                image: Buffer.from(imageBuffer).toString('base64')
            }),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const resultBuffer = await response.arrayBuffer();
    
    // Save the output image locally to verify
    const outputPath = './flatlay-result.jpg';
    fs.writeFileSync(outputPath, Buffer.from(resultBuffer));
    
    console.log('\n✅ AI HAS RECREATED THE IMAGE!');
    console.log(`🖼️ Output saved locally at: ${outputPath}`);
    console.log('Aap is file ko open karke dekh sakte ho.');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
  }
}

testHFFlatLay();
