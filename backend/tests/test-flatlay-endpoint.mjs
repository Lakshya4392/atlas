import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';

async function testEndpoint() {
  console.log('Testing /api/clothes/flatlay endpoint...');
  
  try {
    // Download a test image first
    const imgRes = await fetch('https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=500&auto=format&fit=crop');
    const imgBuffer = await imgRes.buffer();

    const form = new FormData();
    form.append('image', imgBuffer, {
      filename: 'test.jpg',
      contentType: 'image/jpeg',
    });

    const startTime = Date.now();
    const res = await fetch('http://localhost:3000/api/clothes/flatlay', {
      method: 'POST',
      body: form,
    });

    const data = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Time taken: ${(Date.now() - startTime) / 1000}s`);
    
    try {
      const json = JSON.parse(data);
      console.log('Response JSON:', json);
    } catch(e) {
      console.log('Response text:', data);
    }

  } catch (error) {
    console.error('Test script error:', error);
  }
}

testEndpoint();
