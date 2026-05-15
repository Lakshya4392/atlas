import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Make sure you have your HF token in your .env file
const HF_TOKEN = process.env.HF_TOKEN || process.env.HF_TOKEN_2 || process.env.HF_TOKEN_3;

if (!HF_TOKEN) {
  console.error("❌ No HF_TOKEN found in .env file.");
  process.exit(1);
}

// You can change this URL to any fashion image you want to test
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop'; 

async function testAutoExtraction() {
  console.log('══════════════════════════════════════════════════');
  console.log('👗 Auto Clothing Extraction Test (SegFormer)');
  console.log('══════════════════════════════════════════════════');
  console.log(`\n📥 Fetching test image...`);
  
  try {
    const imageRes = await fetch(TEST_IMAGE_URL);
    const imageBuffer = await imageRes.arrayBuffer();
    
    console.log(`🤖 Sending to Hugging Face Model (mattmdjaga/segformer_b2_clothes)...`);
    console.log(`⏳ Please wait, analyzing clothes...`);

    // We use the direct inference API which returns distinct labels and masks
    const res = await fetch(
      "https://api-inference.huggingface.co/models/mattmdjaga/segformer_b2_clothes",
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "image/jpeg",
        },
        method: "POST",
        body: Buffer.from(imageBuffer),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API Error: ${res.status} ${err}`);
    }

    const data = await res.json();
    
    console.log('\n✅ Extraction Complete! Here is what the AI found:');
    
    // The API returns an array of detected segments. 
    // Example: [{ score: 0.99, label: "Upper-clothes", mask: "base64..." }]
    let foundClothes = false;

    data.forEach((item, index) => {
      // We only care about clothing items, ignoring hair, face, background etc.
      if (['Upper-clothes', 'Pants', 'Skirt', 'Dress', 'Coat'].includes(item.label)) {
        foundClothes = true;
        console.log(`\n👕 Item ${index + 1}: ${item.label.toUpperCase()}`);
        console.log(`   Confidence: ${(item.score * 100).toFixed(2)}%`);
        console.log(`   Action: We can use the returned 'mask' to instantly cut out just this ${item.label} and save it to the closet!`);
      }
    });

    if (!foundClothes) {
      console.log('\n⚠️ No clothes detected in this image.');
    }

    console.log('\n💡 HOW IT WORKS FOR AUTO-ADD:');
    console.log('1. User uploads a photo of themselves.');
    console.log('2. This API returns the exact shape (mask) of the Shirt and the Pants.');
    console.log('3. We use a library (like "sharp" in Node.js) to cut out those exact shapes from the original photo.');
    console.log('4. Now you have 2 perfect transparent images (1 shirt, 1 pant) with original design intact.');
    console.log('5. They get uploaded to Cloudinary and added to the database automatically!');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
  }
}

testAutoExtraction();
