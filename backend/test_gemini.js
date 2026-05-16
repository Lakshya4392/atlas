const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
require('dotenv').config();

async function testImagen() {
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

    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`;

    await axios.post(url, {
      instances: [{ prompt: "A red apple" }],
      parameters: { sampleCount: 1 }
    }, {
      headers: { Authorization: `Bearer ${token.token}` }
    });

    console.log("✅ WORKS: imagen-3");
  } catch (err) {
    console.log("❌ FAILED: imagen-3", err.response ? err.response.status : err.message);
  }
}
testImagen();
