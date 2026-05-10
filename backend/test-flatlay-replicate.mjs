import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();
import Replicate from "replicate";

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

if (!REPLICATE_API_TOKEN) {
  console.log('❌ REPLICATE_API_TOKEN nahi mila .env file me.');
  process.exit(1);
}

const replicate = new Replicate({
  auth: REPLICATE_API_TOKEN,
});

// Ye ek messy t-shirt ki test photo hai
const MESSY_SHIRT_URL = 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=500&auto=format&fit=crop'; 

async function testReplicateFlatLay() {
  console.log('══════════════════════════════════════════════════');
  console.log('👕 Messy Image to Perfect Flat-Lay (Using REPLICATE)');
  console.log('══════════════════════════════════════════════════');
  
  try {
    console.log('🤖 Sending messy shirt image to Replicate (InstructPix2Pix)...');
    console.log('⏳ Model is recreating the image (Takes 5-10 seconds)...');

    const output = await replicate.run(
      "timbrooks/instruct-pix2pix:30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f",
      {
        input: {
          image: MESSY_SHIRT_URL,
          prompt: "make it a perfectly flat laid t-shirt on a pure white background, straight, top-down view",
          scheduler: "K_EULER_ANCESTRAL",
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 100,
          image_guidance_scale: 1.5
        }
      }
    );

    console.log('\n✅ AI HAS RECREATED THE IMAGE!');
    console.log('\n🖼️ PERFECT FLAT-LAY IMAGE URL:');
    console.log('👉', output[0] || output);
    
    console.log('\n👆 Is link ko browser me open karke dekho!');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
  }
}

testReplicateFlatLay();
