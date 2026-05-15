const { client } = require('@gradio/client');
const fs = require('fs');

async function test() {
  try {
    // create a dummy image buffer (1x1 transparent png)
    const imgBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==', 'base64');
    const imageBlob = new Blob([new Uint8Array(imgBuffer)], { type: 'image/png' });

    const app = await client("InstantX/InstantID");
    console.log("Connected to InstantID...");
    
    const result = await app.predict("/generate_image", [
          imageBlob, // 1. Face image
          imageBlob, // 2. Pose Reference Image
          "professional fashion photoshoot, perfect straight posture", // 3. Prompt
          "blurry, deformed", // 4. Negative prompt
          "Zero", // 5. Style template
          20, // 6. Number of sample steps
          0.8, // 7. IdentityNet strength
          0.8, // 8. Image adapter strength
          0.4, // 9. Canny strength
          0.4, // 10. Depth strength
          ["pose", "canny"], // 11. Controlnet selection
          5.0, // 12. Guidance scale
          Math.floor(Math.random() * 100000), // 13. Seed
          "EulerDiscreteScheduler", // 14. Schedulers
          false, // 15. Enable LCM
          true // 16. Enhance non-face region
      ]);
      console.log("Success!");
  } catch (e) {
    console.error("Error:", e.message || e);
  }
}
test();
