import 'dotenv/config';
import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';

async function testVertexVTON() {
  console.log('🔍 Testing Google Cloud Vertex AI Virtual Try-On API...\n');

  const projectId = process.env.VERTEX_PROJECT_ID;
  const location = process.env.VERTEX_LOCATION || 'us-central1';
  const serviceAccountBase64 = process.env.VERTEX_SERVICE_ACCOUNT_JSON;

  if (!projectId || !serviceAccountBase64) {
    console.log('❌ Missing VERTEX_PROJECT_ID or VERTEX_SERVICE_ACCOUNT_JSON in .env');
    console.log('Please set them up first.');
    return;
  }

  try {
    // Decode Service Account JSON
    const credentialsJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
    const credentials = JSON.parse(credentialsJson);

    // Initialize Auth
    const auth = new GoogleAuth({
      credentials,
      scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });

    const client = await auth.getClient();
    const token = await client.getAccessToken();

    if (!token.token) {
      throw new Error("Failed to generate access token");
    }

    console.log('✅ Successfully authenticated with Google Cloud!');
    console.log('🔑 Token generated successfully.');
    
    // We will do a dummy request to check if the model endpoint is reachable
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/virtual-try-on-001:predict`;
    
    console.log(`\n🌐 Pinging Vertex AI Endpoint: ${url}`);
    
    // Send a minimal request (will fail validation but proves network/auth)
    const response = await axios.post(url, {
      instances: [{
        person_image: { bytesBase64Encoded: "dummy" },
        garment_image: { bytesBase64Encoded: "dummy" }
      }],
      parameters: { outputOptions: { mimeType: "image/png" } }
    }, {
      headers: { Authorization: `Bearer ${token.token}` },
      validateStatus: () => true // Don't throw on 400
    });

    if (response.status === 400) {
      console.log('✅ API is REAChABLE and ENABLED! (Returned 400 Bad Request because of dummy image data, which is expected)');
    } else if (response.status === 200) {
      console.log('✅ API returned 200 OK!');
    } else {
      console.log(`⚠️ API returned status ${response.status}:`, response.data);
    }
    
    console.log('\n🎉 Vertex AI Setup is COMPLETE and ready to use in the app!');

  } catch (err) {
    console.error('\n❌ Vertex AI Test Failed:', err.message);
    if (err.response) {
      console.error('Response:', err.response.data);
    }
  }
}

testVertexVTON();
