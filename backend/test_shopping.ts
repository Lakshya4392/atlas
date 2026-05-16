import axios from 'axios';

async function test() {
  const apiKey = process.env.SERP_API_KEY;
  const response = await axios.get('https://serpapi.com/search.json', {
    params: {
      engine: 'google_shopping',
      q: "men's trendy graphic t-shirts",
      api_key: apiKey,
    },
  });
  
  const results = response.data.shopping_results.slice(0, 1);
  console.log(JSON.stringify(results[0], null, 2));
}

test();
