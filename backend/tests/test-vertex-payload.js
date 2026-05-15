require('dotenv').config();
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');

(async () => {
  try {
    const serviceAccountBase64 = process.env.VERTEX_SERVICE_ACCOUNT_JSON;
    const credentialsJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
    const credentials = JSON.parse(credentialsJson);

    const auth = new GoogleAuth({
      credentials,
      scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });

    const client = await auth.getClient();
    const token = await client.getAccessToken();

    // Use tiny 1x1 base64 pixels just to check if the API returns a VALID response format or an error!
    const personBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const garmentBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

    const url = 'https://us-central1-aiplatform.googleapis.com/v1/projects/' + credentials.project_id + '/locations/us-central1/publishers/google/models/virtual-try-on-001:predict';

    console.log("Sending request to:", url);
    const response = await axios.post(url, {
      instances: [{
        personImage: {
          image: { bytesBase64Encoded: personBase64 }
        },
        productImages: [{
          image: { bytesBase64Encoded: garmentBase64 }
        }]
      }],
      parameters: { sampleCount: 1 }
    }, {
      headers: { Authorization: `Bearer ${token.token}` }
    });

    console.log('SUCCESS:', JSON.stringify(response.data).substring(0, 200));
  } catch (e) {
    console.error('ERROR:', e.response ? JSON.stringify(e.response.data) : e.message);
  }
})();
