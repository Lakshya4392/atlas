import axios from 'axios';

async function test() {
  const apiKey = process.env.SERP_API_KEY;
  const response = await axios.get('https://serpapi.com/search.json', {
    params: {
      engine: 'google_images',
      q: "men's graphic t-shirt flat lay white background product shot -model -person",
      api_key: apiKey,
      tbm: 'isch',
      ijn: '0'
    },
  });
  
  const results = response.data.images_results.slice(0, 5);
  for (const item of results) {
    console.log(`\nTitle: ${item.title}`);
    console.log(`Image: ${item.original}`);
  }
}

test();
