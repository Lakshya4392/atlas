const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
const sharp = require('sharp');
require('dotenv').config();

async function testOutpaint() {
  try {
    const projectId = process.env.VERTEX_PROJECT_ID;
    const location = process.env.VERTEX_LOCATION || 'us-central1';
    const credentialsJson = Buffer.from(process.env.VERTEX_SERVICE_ACCOUNT_JSON, 'base64').toString('utf8');
    const credentials = JSON.parse(credentialsJson);

    const auth = new GoogleAuth({
      credentials,
      scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    // Create a dummy 768x1024 image with a red square at the top
    const baseImage = await sharp({
      create: { width: 768, height: 1024, channels: 3, background: { r: 255, g: 255, b: 255 } }
    }).jpeg().toBuffer();

    // Create a mask (bottom half is white = edit area, top half is black = keep original)
    const maskImage = await sharp({
      create: { width: 768, height: 1024, channels: 3, background: { r: 255, g: 255, b: 255 } } // all white to edit all
    }).jpeg().toBuffer();

    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-capability-001:predict`;

    console.log("Sending request to Imagen 3 Capability...");
    const res = await axios.post(url, {
      instances: [{
        image: { bytesBase64Encoded: baseImage.toString('base64') },
        mask: { image: { bytesBase64Encoded: maskImage.toString('base64') } },
        prompt: "A beautiful scenery"
      }],
      parameters: { sampleCount: 1 }
    }, {
      headers: { Authorization: `Bearer ${token.token}` }
    });

    console.log("✅ WORKS! Response keys:", Object.keys(res.data));
  } catch (err) {
    console.log("❌ FAILED:", err.response ? err.response.status + " " + JSON.stringify(err.response.data) : err.message);
  }
}
testOutpaint();
