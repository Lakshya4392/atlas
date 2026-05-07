// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Types
export interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  stylePreferences: string[];
  wardrobeStats: {
    totalItems: number;
    totalOutfits: number;
    favoriteItems: number;
    currentStreak: number;
    longestStreak: number;
  };
  settings: {
    notifications: boolean;
    weatherSuggestions: boolean;
    aiSuggestions: boolean;
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClothingItem {
  _id: string;
  user: string;
  name: string;
  category: string;
  subcategory?: string;
  brand?: string;
  color: string;
  colorHex: string;
  size?: string;
  material?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
  images: string[];
  tags: string[];
  favorite: boolean;
  wearCount: number;
  lastWorn?: string;
  season: ('spring' | 'summer' | 'fall' | 'winter')[];
  occasions: string[];
  notes?: string;
  aiDescription?: string;
  aiTags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Outfit {
  _id: string;
  user: string;
  name: string;
  description?: string;
  occasion: string;
  weather?: string;
  season?: string;
  items: ClothingItem[];
  images?: string[];
  aiGenerated: boolean;
  aiPrompt?: string;
  rating?: number;
  favorite: boolean;
  wearCount: number;
  lastWorn?: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  _id: string;
  user: string;
  destination: string;
  description?: string;
  startDate: string;
  endDate: string;
  weather: string;
  temperature: number;
  duration: number;
  packingList: {
    item: ClothingItem;
    packed: boolean;
    category: string;
    aiSuggested: boolean;
  }[];
  aiGenerated: boolean;
  aiPrompt?: string;
  notes?: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// API Response types
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// Auth token storage
let accessToken: string | null = null;
let refreshToken: string | null = null;

// Helper functions
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  ...(accessToken && { Authorization: `Bearer ${accessToken}` })
});

const handleApiError = (error: any) => {
  if (error.response?.status === 401) {
    // Token expired, try refresh
    accessToken = null;
    // You might want to implement token refresh logic here
  }
  throw error;
};

// Auth API
export const authAPI = {
  register: async (email: string, password: string, name: string): Promise<User & { tokens: { accessToken: string; refreshToken: string } }> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });

    if (!response.ok) throw new Error('Registration failed');

    const data: ApiResponse<User & { tokens: { accessToken: string; refreshToken: string } }> = await response.json();
    if (!data.success) throw new Error(data.message);

    accessToken = data.data!.tokens.accessToken;
    refreshToken = data.data!.tokens.refreshToken;

    return data.data!;
  },

  login: async (email: string, password: string): Promise<User & { tokens: { accessToken: string; refreshToken: string } }> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) throw new Error('Login failed');

    const data: ApiResponse<User & { tokens: { accessToken: string; refreshToken: string } }> = await response.json();
    if (!data.success) throw new Error(data.message);

    accessToken = data.data!.tokens.accessToken;
    refreshToken = data.data!.tokens.refreshToken;

    return data.data!;
  },

  logout: async (): Promise<void> => {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    accessToken = null;
    refreshToken = null;
  }
};

// Wardrobe API
export const wardrobeAPI = {
  getItems: async (params?: {
    category?: string;
    favorite?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ items: ClothingItem[]; pagination: any }> => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.favorite) queryParams.append('favorite', 'true');
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_BASE_URL}/wardrobe?${queryParams}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch wardrobe');

    const data: ApiResponse<{ items: ClothingItem[]; pagination: any }> = await response.json();
    if (!data.success) throw new Error(data.message);

    return data.data!;
  },

  addItem: async (itemData: Partial<ClothingItem>, images?: File[]): Promise<ClothingItem> => {
    const formData = new FormData();

    // Add text data
    Object.entries(itemData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Add images
    if (images) {
      images.forEach((image, index) => {
        formData.append('images', image);
      });
    }

    const response = await fetch(`${API_BASE_URL}/wardrobe`, {
      method: 'POST',
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` })
        // Don't set Content-Type for FormData
      },
      body: formData
    });

    if (!response.ok) throw new Error('Failed to add item');

    const data: ApiResponse<ClothingItem> = await response.json();
    if (!data.success) throw new Error(data.message);

    return data.data!;
  },

  updateItem: async (id: string, itemData: Partial<ClothingItem>, images?: File[]): Promise<ClothingItem> => {
    const formData = new FormData();

    Object.entries(itemData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    if (images) {
      images.forEach((image, index) => {
        formData.append('images', image);
      });
    }

    const response = await fetch(`${API_BASE_URL}/wardrobe/${id}`, {
      method: 'PUT',
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` })
      },
      body: formData
    });

    if (!response.ok) throw new Error('Failed to update item');

    const data: ApiResponse<ClothingItem> = await response.json();
    if (!data.success) throw new Error(data.message);

    return data.data!;
  },

  deleteItem: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/wardrobe/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error('Failed to delete item');

    const data: ApiResponse<void> = await response.json();
    if (!data.success) throw new Error(data.message);
  },

  searchItems: async (query: string): Promise<ClothingItem[]> => {
    const response = await fetch(`${API_BASE_URL}/wardrobe/search?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error('Search failed');

    const data: ApiResponse<ClothingItem[]> = await response.json();
    if (!data.success) throw new Error(data.message);

    return data.data!;
  }
};

// AI API
export const aiAPI = {
  chat: async (message: string, chatId?: string): Promise<{
    chatId: string;
    message: string;
    chat: any;
  }> => {
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message, chatId })
    });

    if (!response.ok) throw new Error('Chat failed');

    const data: ApiResponse<any> = await response.json();
    if (!data.success) throw new Error(data.message);

    return data.data!;
  },

  generateOutfit: async (params: {
    occasion: string;
    weather?: string;
    preferences?: string;
  }): Promise<{ outfit: Outfit; reasoning: string }> => {
    const response = await fetch(`${API_BASE_URL}/ai/generate-outfit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });

    if (!response.ok) throw new Error('Outfit generation failed');

    const data: ApiResponse<{ outfit: Outfit; reasoning: string }> = await response.json();
    if (!data.success) throw new Error(data.message);

    return data.data!;
  }
};

// Outfits API
export const outfitsAPI = {
  getOutfits: async (params?: {
    occasion?: string;
    favorite?: boolean;
    aiGenerated?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ outfits: Outfit[]; pagination: any }> => {
    const queryParams = new URLSearchParams();
    if (params?.occasion) queryParams.append('occasion', params.occasion);
    if (params?.favorite) queryParams.append('favorite', 'true');
    if (params?.aiGenerated !== undefined) queryParams.append('aiGenerated', params.aiGenerated.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_BASE_URL}/outfits?${queryParams}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch outfits');

    const data: ApiResponse<{ outfits: Outfit[]; pagination: any }> = await response.json();
    if (!data.success) throw new Error(data.message);

    return data.data!;
  },

  createOutfit: async (outfitData: Partial<Outfit>): Promise<Outfit> => {
    const response = await fetch(`${API_BASE_URL}/outfits`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(outfitData)
    });

    if (!response.ok) throw new Error('Failed to create outfit');

    const data: ApiResponse<Outfit> = await response.json();
    if (!data.success) throw new Error(data.message);

    return data.data!;
  },

  updateOutfit: async (id: string, outfitData: Partial<Outfit>): Promise<Outfit> => {
    const response = await fetch(`${API_BASE_URL}/outfits/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(outfitData)
    });

    if (!response.ok) throw new Error('Failed to update outfit');

    const data: ApiResponse<Outfit> = await response.json();
    if (!data.success) throw new Error(data.message);

    return data.data!;
  },

  wearOutfit: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/outfits/${id}/wear`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error('Failed to log outfit wear');

    const data: ApiResponse<void> = await response.json();
    if (!data.success) throw new Error(data.message);
  },

  rateOutfit: async (id: string, rating: number): Promise<Outfit> => {
    const response = await fetch(`${API_BASE_URL}/outfits/${id}/rate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rating })
    });

    if (!response.ok) throw new Error('Failed to rate outfit');

    const data: ApiResponse<Outfit> = await response.json();
    if (!data.success) throw new Error(data.message);

    return data.data!;
  }
};

// Trips API
export const tripsAPI = {
  getTrips: async (params?: {
    status?: string;
    upcoming?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ trips: Trip[]; pagination: any }> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.upcoming) queryParams.append('upcoming', 'true');
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_BASE_URL}/trips?${queryParams}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch trips');

    const data: ApiResponse<{ trips: Trip[]; pagination: any }> = await response.json();
    if (!data.success) throw new Error(data.message);

    return data.data!;
  },

  createTrip: async (tripData: Partial<Trip>): Promise<Trip> => {
    const response = await fetch(`${API_BASE_URL}/trips`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(tripData)
    });

    if (!response.ok) throw new Error('Failed to create trip');

    const data: ApiResponse<Trip> = await response.json();
    if (!data.success) throw new Error(data.message);

    return data.data!;
  },

  generatePackingList: async (tripId: string): Promise<{
    trip: Trip;
    suggestions: any[];
  }> => {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/generate-packing`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error('Failed to generate packing list');

    const data: ApiResponse<any> = await response.json();
    if (!data.success) throw new Error(data.message);

    return data.data!;
  }
};

// Analytics API
export const analyticsAPI = {
  getAnalytics: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/analytics`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch analytics');

    const data: ApiResponse<any> = await response.json();
    if (!data.success) throw new Error(data.message);

    return data.data!;
  },

  getWearPatterns: async (period: string = 'month'): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/analytics/wear-patterns?period=${period}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch wear patterns');

    const data: ApiResponse<any> = await response.json();
    if (!data.success) throw new Error(data.message);

    return data.data!;
  },

  getStyleInsights: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/analytics/style-insights`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch style insights');

    const data: ApiResponse<any> = await response.json();
    if (!data.success) throw new Error(data.message);

    return data.data!;
  }
};