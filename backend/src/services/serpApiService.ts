import axios from 'axios';

export interface SerpApiResult {
  title: string;
  brand: string;
  price: string;
  thumbnail: string;
  link: string;
  source: string;
}

export const searchFashionProducts = async (query: string): Promise<SerpApiResult[]> => {
  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) {
    throw new Error('SERP_API_KEY is not configured in the environment variables');
  }

  try {
    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_shopping',
        q: query,
        api_key: apiKey,
      },
    });

    const results = response.data.shopping_results;
    if (!results || results.length === 0) {
      return [];
    }

    // Format and normalize the response structure
    return results.map((item: any) => ({
      title: item.title || '',
      brand: item.source || 'Unknown Brand',
      price: item.price || 'Price unavailable',
      thumbnail: item.thumbnail || '',
      link: item.link || '',
      source: item.source || 'Google Shopping',
    }));
  } catch (error: any) {
    console.error('SerpAPI search failed:', error?.response?.data || error.message);
    
    // Add rate limit protection / error reporting
    if (error?.response?.status === 429) {
      throw new Error('Rate limit exceeded for SerpAPI');
    }
    throw new Error('Failed to fetch fashion products from SerpAPI');
  }
};
