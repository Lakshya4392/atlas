/**
 * Mock data for Fashion X
 */

export interface ClothingItem {
  id: string;
  name: string;
  category: string;
  color: string;
  colorHex: string;
  brand: string;
  image: any;
  tags: string[];
  wearCount: number;
  lastWorn?: string;
  favorite: boolean;
}

export interface Outfit {
  id: string;
  name: string;
  occasion: string;
  items: string[];
  rating: number;
  aiGenerated: boolean;
  weather: string;
  date: string;
}

export interface StyleTip {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  brand: string;
  price: string;
  image: string;
  category: string;
  saved: boolean;
}

export interface InspoBoardItem {
  id: string;
  title: string;
  style: string;
  emoji: string;
  colors: string[];
  tags: string[];
  likes: number;
  saved: boolean;
}

export interface TripItem {
  id: string;
  destination: string;
  dates: string;
  weather: string;
  emoji: string;
  packedItems: number;
  totalItems: number;
}

export const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'grid-outline' },
  { id: 'tops', name: 'Tops', icon: 'shirt-outline' },
  { id: 'bottoms', name: 'Bottoms', icon: 'resize-outline' },
  { id: 'shoes', name: 'Shoes', icon: 'footsteps-outline' },
  { id: 'outerwear', name: 'Outerwear', icon: 'cloudy-outline' },
  { id: 'accessories', name: 'Accessories', icon: 'watch-outline' },
  { id: 'dresses', name: 'Dresses', icon: 'flower-outline' },
];

export const CLOTHING_ITEMS: ClothingItem[] = [
  {
    id: '1', name: 'Vintage Wash Denim Jacket', category: 'outerwear',
    color: 'Indigo', colorHex: '#5A7A9E', brand: 'Archive Est. 109A', image: require('../assets/images/denim_jacket.png'),
    tags: ['casual', 'basic', 'summer'], wearCount: 24, lastWorn: '2026-05-04', favorite: true,
  },
  {
    id: '2', name: 'Nylon Full Zip Hoodie', category: 'outerwear',
    color: 'Beige', colorHex: '#E5E5E0', brand: 'Architect', image: require('../assets/images/beige_hoodie.png'),
    tags: ['luxury', 'everyday', 'minimal'], wearCount: 45, lastWorn: '2026-05-06', favorite: true,
  },
  {
    id: '3', name: 'Denim Track Jacket', category: 'outerwear',
    color: 'Blue', colorHex: '#5A7A9E', brand: 'Archive Est. 109A', image: require('../assets/images/denim_jacket.png'),
    tags: ['edgy', 'statement', 'fall'], wearCount: 12, lastWorn: '2026-04-28', favorite: true,
  },
  {
    id: '4', name: 'Classic Beige Hoodie', category: 'tops',
    color: 'Beige', colorHex: '#E5E5E0', brand: 'Architect', image: require('../assets/images/beige_hoodie.png'),
    tags: ['casual', 'everyday', 'minimal'], wearCount: 45, lastWorn: '2026-05-06', favorite: false,
  },
  {
    id: '5', name: 'Oversized Denim Shirt', category: 'tops',
    color: 'Indigo', colorHex: '#5A7A9E', brand: 'Archive Est. 109A', image: require('../assets/images/denim_jacket.png'),
    tags: ['casual', 'layering'], wearCount: 8, lastWorn: '2026-05-01', favorite: false,
  },
  {
    id: '6', name: 'Heavyweight Fleece Hoodie', category: 'tops',
    color: 'Sand', colorHex: '#E5E5E0', brand: 'Essentials', image: require('../assets/images/beige_hoodie.png'),
    tags: ['cozy', 'winter'], wearCount: 32, lastWorn: '2026-04-15', favorite: false,
  },
  {
    id: '7', name: 'Raw Denim Work Coat', category: 'outerwear',
    color: 'Dark Blue', colorHex: '#1E3A5F', brand: 'Workwear Co.', image: require('../assets/images/denim_jacket.png'),
    tags: ['utilitarian', 'rugged'], wearCount: 15, lastWorn: '2026-05-05', favorite: true,
  },
  {
    id: '8', name: 'Premium Cotton Hoodie', category: 'tops',
    color: 'Off-White', colorHex: '#F8FAFC', brand: 'Luxe Basic', image: require('../assets/images/beige_hoodie.png'),
    tags: ['premium', 'minimalist'], wearCount: 20, lastWorn: '2026-05-07', favorite: true,
  },
  {
    id: '9', name: 'Sherpa Lined Denim Jacket', category: 'outerwear',
    color: 'Light Wash', colorHex: '#A5B4FC', brand: 'Winter Archive', image: require('../assets/images/denim_jacket.png'),
    tags: ['winter', 'warm', 'classic'], wearCount: 5, lastWorn: '2026-04-20', favorite: false,
  },
  {
    id: '10', name: 'Boxy Fit Hoodie', category: 'tops',
    color: 'Cream', colorHex: '#FEF3C7', brand: 'Modernist', image: require('../assets/images/beige_hoodie.png'),
    tags: ['streetwear', 'boxy'], wearCount: 18, lastWorn: '2026-05-02', favorite: true,
  },
  {
    id: '11', name: 'Vintage Trucker Jacket', category: 'outerwear',
    color: 'Distressed Blue', colorHex: '#3B82F6', brand: 'Heritage', image: require('../assets/images/denim_jacket.png'),
    tags: ['vintage', 'distressed'], wearCount: 22, lastWorn: '2026-05-06', favorite: false,
  },
  {
    id: '12', name: 'Soft Tech Hoodie', category: 'tops',
    color: 'Bone', colorHex: '#F1F5F9', brand: 'Performance', image: require('../assets/images/beige_hoodie.png'),
    tags: ['tech', 'activewear'], wearCount: 14, lastWorn: '2026-05-03', favorite: false,
  },
];

export const OUTFITS: Outfit[] = [
  {
    id: 'o1', name: 'Casual Friday', occasion: 'Work',
    items: ['1', '2', '4', '7'], rating: 4.5, aiGenerated: true,
    weather: 'Sunny, 28°C', date: '2026-05-06',
  },
  {
    id: 'o2', name: 'Night Out', occasion: 'Evening',
    items: ['3', '2', '9', '7'], rating: 4.8, aiGenerated: true,
    weather: 'Clear, 22°C', date: '2026-05-05',
  },
  {
    id: 'o3', name: 'Weekend Brunch', occasion: 'Casual',
    items: ['10', '6', '4', '12'], rating: 4.2, aiGenerated: false,
    weather: 'Partly Cloudy, 25°C', date: '2026-05-04',
  },
  {
    id: 'o4', name: 'Elegant Evening', occasion: 'Date Night',
    items: ['11', '9', '7'], rating: 5.0, aiGenerated: true,
    weather: 'Cool, 18°C', date: '2026-05-03',
  },
];

export const STYLE_TIPS = [
  {
    id: 't1', title: 'Color Harmony',
    description: 'Pair your Indigo denim with earth tones like Camel or Olive for a sophisticated palette.',
    icon: 'color-palette-outline', category: 'color',
  },
  {
    id: 't2', title: 'Layering Pro',
    description: 'Your leather jacket works best over fitted basics. Try it with your white tee.',
    icon: 'layers-outline', category: 'technique',
  },
  {
    id: 't3', title: 'Weather Ready',
    description: "Light linen pieces are ideal for tomorrow's forecast. Consider your Sky Blue shirt.",
    icon: 'sunny-outline', category: 'weather',
  },
  {
    id: 't4', title: 'Unused Gems',
    description: "Your Silk Midi Dress hasn't been worn in 26 days. Perfect for upcoming occasions!",
    icon: 'diamond-outline', category: 'suggestion',
  },
];

export const WEATHER_DATA = {
  current: { temp: 28, condition: 'Sunny', humidity: 45, icon: 'sunny' },
  forecast: [
    { day: 'Today', temp: 28, condition: 'Sunny', icon: 'sunny' },
    { day: 'Wed', temp: 26, condition: 'Partly Cloudy', icon: 'partly-sunny' },
    { day: 'Thu', temp: 24, condition: 'Cloudy', icon: 'cloudy' },
    { day: 'Fri', temp: 22, condition: 'Rain', icon: 'rainy' },
    { day: 'Sat', temp: 25, condition: 'Clear', icon: 'sunny' },
  ],
};

export const USER_PROFILE = {
  name: 'Alex',
  avatar: '👤',
  style: 'Smart Casual',
  closetCount: 12,
  outfitCount: 4,
  streak: 14,
  level: 'Style Explorer',
};

export const WISHLIST_ITEMS: WishlistItem[] = [
  { id: 'w1', name: 'Merino Wool Coat', brand: 'Toteme', price: '€890', image: '🧥', category: 'outerwear', saved: true },
  { id: 'w2', name: 'Leather Loafers', brand: 'Gucci', price: '€650', image: '👞', category: 'shoes', saved: true },
  { id: 'w3', name: 'Silk Blouse', brand: 'Equipment', price: '€280', image: '👚', category: 'tops', saved: false },
  { id: 'w4', name: 'Wide Leg Trousers', brand: 'Arket', price: '€120', image: '👖', category: 'bottoms', saved: true },
  { id: 'w5', name: 'Gold Chain Necklace', brand: 'Mejuri', price: '€95', image: '📿', category: 'accessories', saved: false },
  { id: 'w6', name: 'Trench Coat', brand: 'Burberry', price: '€1,890', image: '🧥', category: 'outerwear', saved: true },
];

export const INSPO_ITEMS: InspoBoardItem[] = [
  { id: 'i1', title: 'Quiet Luxury', style: 'Minimalist', emoji: '🤍', colors: ['#F5F4F0', '#D4A574', '#1A1A1A'], tags: ['minimal', 'neutral', 'elevated'], likes: 2840, saved: true },
  { id: 'i2', title: 'Street Editorial', style: 'Streetwear', emoji: '🖤', colors: ['#1A1A1A', '#374151', '#F1F5F9'], tags: ['urban', 'bold', 'layered'], likes: 1920, saved: false },
  { id: 'i3', title: 'Summer Coastal', style: 'Casual', emoji: '🌊', colors: ['#7DD3FC', '#F8FAFC', '#D4A574'], tags: ['summer', 'light', 'breezy'], likes: 3100, saved: true },
  { id: 'i4', title: 'Power Dressing', style: 'Work', emoji: '💼', colors: ['#1E3A5F', '#F8FAFC', '#CBD5E1'], tags: ['office', 'sharp', 'confident'], likes: 1560, saved: false },
  { id: 'i5', title: 'Golden Hour', style: 'Evening', emoji: '✨', colors: ['#F59E0B', '#1A1A1A', '#059669'], tags: ['evening', 'glam', 'statement'], likes: 4200, saved: true },
  { id: 'i6', title: 'Monochrome Edit', style: 'Minimalist', emoji: '⬛', colors: ['#1A1A1A', '#374151', '#6B7280'], tags: ['mono', 'sleek', 'modern'], likes: 2100, saved: false },
];

export const TRIPS: TripItem[] = [
  { id: 'tr1', destination: 'Paris', dates: 'Jun 12–18', weather: '22°C Sunny', emoji: '🗼', packedItems: 8, totalItems: 12 },
  { id: 'tr2', destination: 'Tokyo', dates: 'Jul 4–10', weather: '28°C Humid', emoji: '🗾', packedItems: 0, totalItems: 0 },
  { id: 'tr3', destination: 'Amalfi Coast', dates: 'Aug 20–27', weather: '32°C Beach', emoji: '🌊', packedItems: 3, totalItems: 10 },
];
