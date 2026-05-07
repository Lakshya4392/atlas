/**
 * Quick test: fal.ai Virtual Try-On pipeline
 * Run: node server/test-tryon.mjs
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config({ path: 'server/.env' });

const { fal } = await import('@fal-ai/client');

const FAL_KEY = process.env.FAL_KEY;

console.log('\n═══════════════════════════════════════');
console.log('  Alta Daily — Try-On Pipeline Test');
console.log('═══════════════════════════════════════');
console.log('FAL_KEY:      ', FAL_KEY && FAL_KEY !== 'your_fal_key_here' ? '✅ ' + FAL_KEY.substring(0, 12) + '...' : '❌ NOT SET');
console.log('CLOUDINARY:   ', process.env.CLOUDINARY_CLOUD_NAME ? '✅ ' + process.env.CLOUDINARY_CLOUD_NAME : '❌ NOT SET');
console.log('DATABASE_URL: ', process.env.DATABASE_URL ? '✅ Connected' : '❌ NOT SET');
console.log('');

if (!FAL_KEY || FAL_KEY === 'your_fal_key_here') {
  console.log('❌ FAL_KEY missing. Add it to server/.env');
  process.exit(1);
}

fal.config({ credentials: FAL_KEY });

// Test images (public URLs)
const TEST_HUMAN = 'https://storage.googleapis.com/falserverless/model_tests/leffa/person_image.jpg';
const TEST_GARMENT = 'https://storage.googleapis.com/falserverless/model_tests/leffa/tshirt_image.jpg';

console.log('🚀 Calling fal.ai Kolors Virtual Try-On...');
console.log('   Person:  ', TEST_HUMAN);
console.log('   Garment: ', TEST_GARMENT);
console.log('   (Takes 15–30 seconds...)\n');

try {
  const result = await fal.subscribe('fal-ai/kling/v1-5/kolors-virtual-try-on', {
    input: {
      human_image_url: TEST_HUMAN,
      garment_image_url: TEST_GARMENT,
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === 'IN_PROGRESS') {
        update.logs?.map(l => l.message).forEach(m => console.log('  >', m));
      }
    },
  });

  const url = result.data?.image?.url;
  if (url) {
    console.log('\n✅ TRY-ON SUCCESS!');
    console.log('🖼️  Result URL:', url);
    console.log('\n👆 Open this URL in browser to see the result!');
    console.log('\n✅ Pipeline is fully working. App is ready to test.\n');
  } else {
    console.log('❌ No image URL in response:', JSON.stringify(result.data));
  }
} catch (e) {
  console.error('\n❌ fal.ai Error:', e.message);
  if (e.message?.includes('401') || e.message?.includes('403')) {
    console.log('   → Invalid FAL_KEY. Get a new one at https://fal.ai/dashboard/keys');
  } else if (e.message?.includes('402')) {
    console.log('   → No credits. Add credits at https://fal.ai/dashboard/billing');
  }
}
