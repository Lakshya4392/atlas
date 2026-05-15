import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ── API Configuration ──
const getApiUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    let ip = hostUri.split(':')[0];
    // If running on Android emulator, 127.0.0.1 or localhost won't work to reach the host PC
    if (Platform.OS === 'android' && (ip === '127.0.0.1' || ip === 'localhost')) {
      ip = '10.0.2.2';
    }
    return `http://${ip}:3000/api`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';
};
const API_BASE_URL = getApiUrl();

// ── Types matching server/prisma/schema.prisma ──
export interface User {
  id: string;
  name: string;
  email: string;
  style: string;
  streak: number;
  level: string;
  avatar?: string;
  occupation?: string;
  wearPreference?: string;
  createdAt: string;
}

export interface ClothingItem {
  id: string;
  name: string;
  category: string;
  color: string;
  brand: string;
  imageUrl: string;
  tags: string[];
  wearCount: number;
  favorite: boolean;
  lastWorn?: string;
  userId: string;
}

export interface Outfit {
  id: string;
  name: string;
  occasion: string;
  rating: number;
  aiGenerated: boolean;
  weather?: string;
  date: string;
  userId: string;
  items: { clothingItem: ClothingItem }[];
}

// ── Auth API ──
export const authAPI = {
  // Register or login — server uses email only (no password)
  register: async (name: string, email: string, password?: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Registration failed');
    return data.user;
  },

  login: async (email: string, password?: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Login failed');
    return data.user;
  },
};

// ── Wardrobe API ──
export const wardrobeAPI = {
  getItems: async (userId: string): Promise<ClothingItem[]> => {
    const response = await fetch(`${API_BASE_URL}/clothes/${userId}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch items');
    return data.items;
  },

  getFashionFeed: async (userId: string): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/fashion/feed/${userId}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch feed');
    return data.data;
  },

  addItem: async (item: {
    userId: string;
    name: string;
    category: string;
    color: string;
    brand: string;
    imageUrl: string;
    tags?: string[];
  }): Promise<ClothingItem> => {
    const response = await fetch(`${API_BASE_URL}/clothes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to add item');
    return data.item;
  },
};

// ── Outfits API ──
export const outfitsAPI = {
  getOutfits: async (userId: string): Promise<Outfit[]> => {
    const response = await fetch(`${API_BASE_URL}/outfits/${userId}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch outfits');
    return data.outfits;
  },

  saveOutfit: async (outfit: {
    userId: string;
    name: string;
    occasion: string;
    itemIds: string[];
    aiGenerated?: boolean;
    weather?: string;
    imageUrl?: string;
  }): Promise<Outfit> => {
    const response = await fetch(`${API_BASE_URL}/outfits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(outfit),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to save outfit');
    return data.outfit;
  },
};

// ── User Stats API ──
export const userAPI = {
  updateAvatar: async (userId: string, avatarUrl: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/avatar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarUrl }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to update avatar');
    return data.user;
  },

  getStats: async (userId: string): Promise<{
    clothesCount: number;
    outfitsCount: number;
    favoritesCount: number;
    streak: number;
    level: string;
    style: string;
  }> => {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/stats`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch stats');
    return data.stats;
  },
};
