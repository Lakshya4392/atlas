const { fal } = require('@fal-ai/client');
require('dotenv').config();

fal.config({ credentials: process.env.FAL_KEY });

async function run() {
  try {
    console.log("Calling fal-ai/flux-pulid...");
    const result = await fal.subscribe('fal-ai/flux-pulid', {
      input: {
        prompt: "A professional studio full-body portrait of a fashion model standing straight, facing the camera, wearing simple casual clothes. Plain white background. Photorealistic.",
        reference_images: [
           { image_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" }
        ],
        image_size: "portrait_4_3",
        num_inference_steps: 20,
        guidance_scale: 3.5
      }
    });
    console.log("Success:", JSON.stringify(result.data, null, 2));
  } catch(e) {
    console.log("Error flux-pulid:", e.message);
    try {
        console.log("Falling back to fal-ai/pulid...");
        const result2 = await fal.subscribe('fal-ai/pulid', {
            input: {
                prompt: "A professional studio full-body portrait of a fashion model standing straight, facing the camera, wearing simple casual clothes. Plain white background. Photorealistic.",
                image_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop"
            }
        });
        console.log("Success:", JSON.stringify(result2.data, null, 2));
    } catch(e2) {
        console.log("Error pulid:", e2.message);
    }
  }
}
run();
