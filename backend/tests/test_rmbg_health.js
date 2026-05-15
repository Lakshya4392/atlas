const fs = require('fs');
require('dotenv').config();

async function testRMBG() {
  try {
    const hfToken = process.env.HF_TOKEN || process.env.HF_TOKEN_2 || process.env.HF_TOKEN_3;
    
    console.log("📡 Pinging Hugging Face RMBG-1.4 API...");
    
    // Send a 1x1 tiny transparent pixel to check if it processes
    const dummyImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==', 'base64');
    
    const res = await fetch('https://api-inference.huggingface.co/models/briaai/RMBG-1.4', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'image/png'
      },
      body: dummyImage
    });

    if (res.ok) {
       console.log("✅ API is AWAKE and HEALTHY! (Status 200)");
       return;
    }

    const data = await res.json();
    console.log(`Status Code: ${res.status}`);
    console.log(`Response:`, data);
    
    if (data.error && data.error.includes('currently loading')) {
       console.log("⏳ API is waking up! Estimated time:", data.estimated_time, "seconds.");
    } else {
       console.log("⚠️ API returned an error:", data.error);
    }
  } catch (error) {
    console.error("❌ Network Error:", error.message);
  }
}

testRMBG();
