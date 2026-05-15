// Test fal.ai Virtual Try-On
require('dotenv').config();
const { fal } = require('@fal-ai/client');

const FAL_KEY = process.env.FAL_KEY;

console.log("🔑 FAL_KEY:", FAL_KEY && FAL_KEY !== 'your_fal_key_here'
  ? FAL_KEY.substring(0, 12) + "..."
  : "❌ NOT SET — get one free at https://fal.ai/dashboard/keys");

if (!FAL_KEY || FAL_KEY === 'your_fal_key_here') {
  console.log("\n👉 Steps to get free API key:");
  console.log("   1. Go to https://fal.ai/dashboard/keys");
  console.log("   2. Sign up (free)");
  console.log("   3. Create API key");
  console.log("   4. Add to server/.env: FAL_KEY=your_key_here");
  process.exit(1);
}

fal.config({ credentials: FAL_KEY });

async function test() {
  console.log("\n🚀 Running Kolors Virtual Try-On (fal.ai)...");
  console.log("   Person photo + Garment photo → merged result");
  console.log("   (Takes 15-30 seconds...)\n");

  try {
    const result = await fal.subscribe('fal-ai/kling/v1-5/kolors-virtual-try-on', {
      input: {
        human_image_url: "https://storage.googleapis.com/falserverless/model_tests/leffa/person_image.jpg",
        garment_image_url: "https://storage.googleapis.com/falserverless/model_tests/leffa/tshirt_image.jpg",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          update.logs?.map(l => l.message).forEach(m => console.log('  >', m));
        }
      },
    });

    const url = result.data?.image?.url;
    console.log("\n✅ Try-On SUCCESS!");
    console.log("🖼️  Result URL:", url);
    console.log("\n👆 Open this URL in browser to see the result!");

  } catch (e) {
    console.error("❌ Error:", e.message);
  }
}

test();
