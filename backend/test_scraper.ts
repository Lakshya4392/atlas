import axios from 'axios';

async function extractCleanImage(productUrl: string, fallbackImage: string): Promise<string> {
  try {
    const response = await axios.get(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 5000
    });
    const html = response.data as string;
    
    let images: string[] = [];

    // 1. Try to find JSON-LD Product schema
    const scriptRegex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        const extractImages = (obj: any) => {
          if (!obj) return;
          if (obj['@type'] === 'Product' || obj['@type'] === 'ProductGroup') {
            if (typeof obj.image === 'string') images.push(obj.image);
            else if (Array.isArray(obj.image)) {
                obj.image.forEach((i: any) => {
                    if (typeof i === 'string') images.push(i);
                    else if (i && typeof i.url === 'string') images.push(i.url);
                })
            }
          }
          if (Array.isArray(obj)) obj.forEach(extractImages);
          else if (typeof obj === 'object') Object.values(obj).forEach(extractImages);
        };
        extractImages(data);
      } catch (e) {}
    }

    // 2. Try OG Image
    const ogRegex = /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i;
    const ogMatch = html.match(ogRegex);
    if (ogMatch && ogMatch[1]) images.push(ogMatch[1]);

    // Filter images to reject models
    const badWords = ['model', 'wearing', 'lifestyle', 'lookbook', 'outfit', 'on-model'];
    const goodImages = images.filter(img => {
      if (!img || typeof img !== 'string') return false;
      const lower = img.toLowerCase();
      return !badWords.some(w => lower.includes(w));
    });

    // Prefer high-res image if found, else fallback
    if (goodImages.length > 0) {
      // return the first good image
      return goodImages[0];
    }
    
    return fallbackImage;
  } catch (err: any) {
    // If blocked or failed, fallback
    console.log(`Failed to fetch ${productUrl}: ${err.message}`);
    return fallbackImage;
  }
}

async function test() {
  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) {
    console.error('No SERP_API_KEY');
    process.exit(1);
  }
  const response = await axios.get('https://serpapi.com/search.json', {
    params: {
      engine: 'google_shopping',
      q: "men's trendy graphic t-shirts",
      api_key: apiKey,
    },
  });
  
  const results = response.data.shopping_results.slice(0, 5);
  for (const item of results) {
    console.log(`\nTitle: ${item.title}`);
    console.log(`Original Thumb: ${item.thumbnail}`);
    const cleanImg = await extractCleanImage(item.link, item.thumbnail);
    console.log(`Clean Image: ${cleanImg}`);
  }
}

test();
