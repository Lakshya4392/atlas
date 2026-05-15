import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';

// ── Virtual Try-On Pipeline ──
// Google Cloud Vertex AI Virtual Try-On Pipeline
export const tryOn = async (req: Request, res: Response) => {
  const { garm_img, human_img, description } = req.body;
  
  if (!process.env.VERTEX_PROJECT_ID || !process.env.VERTEX_SERVICE_ACCOUNT_JSON) {
    return res.status(400).json({ success: false, error: 'Google Vertex AI is not configured in .env' });
  }
  if (!garm_img || !human_img) {
    return res.status(400).json({ success: false, error: 'garm_img and human_img are required' });
  }

  try {
    console.log('🚀 Virtual Try-On Pipeline Starting (Vertex AI Only)...');

    // Step 1: Fetch images and convert to Blobs
    console.log('📥 Fetching input images...');
    const humanRes = await fetch(human_img);
    const humanBlob = await humanRes.blob();

    const garmRes = await fetch(garm_img);
    const garmBlob = await garmRes.blob();

    let success = false;
    let generatedImageUrl = '';

    // Step 2: Google Vertex AI Virtual Try-On
    if (process.env.VERTEX_PROJECT_ID && process.env.VERTEX_SERVICE_ACCOUNT_JSON) {
      console.log('🚀 Google Cloud Vertex AI Virtual Try-On Starting...');
      try {
        const projectId = process.env.VERTEX_PROJECT_ID;
        const location = process.env.VERTEX_LOCATION || 'us-central1';
        const serviceAccountBase64 = process.env.VERTEX_SERVICE_ACCOUNT_JSON;
        
        const credentialsJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
        const credentials = JSON.parse(credentialsJson);

        const { GoogleAuth } = require('google-auth-library');
        const axios = require('axios');

        const auth = new GoogleAuth({
          credentials,
          scopes: 'https://www.googleapis.com/auth/cloud-platform'
        });

        const client = await auth.getClient();
        const token = await client.getAccessToken();

        const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/virtual-try-on-001:predict`;
        
        const personBase64 = Buffer.from(await humanBlob.arrayBuffer()).toString('base64');
        const garmentBase64 = Buffer.from(await garmBlob.arrayBuffer()).toString('base64');

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

        if (response.data && response.data.predictions && response.data.predictions[0] && response.data.predictions[0].bytesBase64Encoded) {
          const generatedBase64 = response.data.predictions[0].bytesBase64Encoded;
          generatedImageUrl = `data:image/png;base64,${generatedBase64}`;
          success = true;
          console.log('✅ Vertex AI Virtual Try-On Successful!');
        } else {
           throw new Error('Invalid response from Vertex AI');
        }
      } catch (err: any) {
        const errorDetail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
        console.warn('⚠️ Vertex AI failed:', errorDetail);
        throw new Error(`Vertex AI Virtual Try-On Failed: ${errorDetail}`);
      }
    }

    if (!success) {
      throw new Error('Vertex AI Virtual Try-On Failed: No credentials found or request failed');
    }

    console.log('✅ Generation Complete! Processing result...');
    
    if (!generatedImageUrl) {
      throw new Error("Invalid output format from Vertex AI");
    }

    console.log('📤 Uploading result to Cloudinary...');
    let dataUri = generatedImageUrl;
    if (!generatedImageUrl.startsWith('data:')) {
      const imgRes = await fetch(generatedImageUrl);
      const imageBuffer = Buffer.from(await imgRes.arrayBuffer());
      dataUri = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    }

    const uploadResult = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload(dataUri, { folder: 'atla_tryon', transformation: [{ quality: 'auto', fetch_format: 'auto' }] }, (err, result) => {
        if (err) reject(err);
        else resolve(result?.secure_url || '');
      });
    });

    console.log('🎉 Try-On Pipeline Complete:', uploadResult);
    res.json({ success: true, url: uploadResult });
  } catch (error: any) {
    console.error('❌ Virtual Try-On Pipeline Failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ── AI Avatar Generation (Google Vertex AI Imagen) ──
export const generateAvatar = async (req: Request, res: Response) => {
  const { gender } = req.body;

  try {
    const prompt = `Full body fashion photography, realistic ${gender || 'female'} model standing straight against a plain white studio background, wearing a simple fitted white t-shirt and grey leggings, photorealistic, 4k, natural lighting, looking directly at camera, neutral expression, hands at sides.`;
    
    let generatedBase64 = '';

    if (process.env.VERTEX_PROJECT_ID && process.env.VERTEX_SERVICE_ACCOUNT_JSON) {
      console.log('🎨 Generating AI Avatar with Vertex AI Imagen 3...');
      const projectId = process.env.VERTEX_PROJECT_ID;
      const location = process.env.VERTEX_LOCATION || 'us-central1';
      const serviceAccountBase64 = process.env.VERTEX_SERVICE_ACCOUNT_JSON;
      
      const credentialsJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
      const credentials = JSON.parse(credentialsJson);

      const { GoogleAuth } = require('google-auth-library');
      const axios = require('axios');

      const auth = new GoogleAuth({
        credentials,
        scopes: 'https://www.googleapis.com/auth/cloud-platform'
      });

      const client = await auth.getClient();
      const token = await client.getAccessToken();

      const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`;
      
      const response = await axios.post(url, {
        instances: [{ prompt: prompt }],
        parameters: { sampleCount: 1, aspectRatio: "3:4" } // 3:4 is great for standing full body models
      }, {
        headers: { Authorization: `Bearer ${token.token}` }
      });

      if (response.data && response.data.predictions && response.data.predictions[0] && response.data.predictions[0].bytesBase64Encoded) {
        generatedBase64 = response.data.predictions[0].bytesBase64Encoded;
      }
    } else {
      throw new Error("Google Vertex AI is not configured. Missing VERTEX credentials in .env");
    }

    if (!generatedBase64) {
      throw new Error("Vertex AI failed to generate avatar.");
    }

    console.log('📤 Uploading generated avatar to Cloudinary...');
    const dataUri = `data:image/jpeg;base64,${generatedBase64}`;

    const uploadResult = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload(dataUri, { 
        folder: 'atla_avatars',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }]
      }, (err, result) => {
        if (err) reject(err);
        else resolve(result?.secure_url || '');
      });
    });

    res.json({ success: true, url: uploadResult });
  } catch (error: any) {
    console.error('❌ AI Avatar Generation Failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
