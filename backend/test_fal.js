const { fal } = require('@fal-ai/client');
require('dotenv').config();

fal.config({ credentials: process.env.FAL_KEY });

async function run() {
  try {
    const result = await fal.subscribe('fal-ai/flux-pulid', {
      input: {
        prompt: "A beautiful scenery",
        reference_images: [{ image_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200" }]
      }
    });
    console.log("Success with flux-pulid");
  } catch(e) {
    console.log("Error flux-pulid:", e.message);
  }
}
run();
