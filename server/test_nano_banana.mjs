import Replicate from "replicate";
import { writeFile } from "fs/promises";
import { config } from "dotenv";

config(); // load .env

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

console.log("🔑 Token loaded:", process.env.REPLICATE_API_TOKEN ? "YES (" + process.env.REPLICATE_API_TOKEN.substring(0, 8) + "...)" : "❌ MISSING");

const input = {
  prompt: "A stylish person wearing a white t-shirt, fashion photography, studio lighting",
  aspect_ratio: "3:4",
  output_format: "png",
};

console.log("\n🚀 Running google/nano-banana-pro...");
console.log("   (Wait 20-40 seconds...)\n");

try {
  const output = await replicate.run("google/nano-banana-pro", { input });

  // This model returns a FileOutput object — get URL like this:
  const url = output.url().href;
  console.log("✅ SUCCESS!");
  console.log("🖼️  Image URL:", url);

  // Optionally save to disk
  // await writeFile("output.png", output);
  // console.log("💾 Saved to output.png");

} catch (e) {
  console.error("❌ Error:", e.message);
}
