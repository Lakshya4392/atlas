import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

const getBackendUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
};

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Shoes', 'Hats', 'Outerwear', 'Accessories'];

export default function DressingRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [user, setUser] = useState<any>(null);
  const [closetItems, setClosetItems] = useState<any[]>([]);
  
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const BACKEND_URL = getBackendUrl();

  useEffect(() => {
    loadUserAndCloset();
  }, []);

  useEffect(() => {
    // If we passed an item from the previous screen, set it as active immediately
    if (params.itemData && user?.digitalTwinUrl && !activeItem) {
      try {
        const parsedItem = JSON.parse(params.itemData as string);
        handleTryOn(parsedItem, user.digitalTwinUrl);
      } catch (e) {
        console.error("Failed to parse initial item", e);
      }
    }
  }, [user, params.itemData]);

  const loadUserAndCloset = async () => {
    setItemsLoading(true);
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        setUser(u);
        setCurrentAvatarUrl(u.digitalTwinUrl);
        
        let allItems: any[] = [];

        // 1. Fetch user's personal closet
        try {
          const res = await fetch(`${BACKEND_URL}/api/clothes/${u.id}`);
          const data = await res.json();
          if (data.success && Array.isArray(data.items)) {
            allItems = data.items.map((i: any) => ({ ...i, _source: 'closet' }));
          }
        } catch (e) {
          console.error("Closet fetch failed", e);
        }

        // 2. Fetch SerpAPI cached fashion products
        try {
          const res2 = await fetch(`${BACKEND_URL}/api/fashion/feed/${u.id}`);
          const data2 = await res2.json();
          if (data2.success && Array.isArray(data2.data)) {
            const serpItems = data2.data.map((p: any) => ({
              id: p.id,
              name: p.title || p.name,
              brand: p.brand || p.source || 'Fashion',
              category: guessCategoryFromTitle(p.title || ''),
              imageUrl: p.thumbnail || p.imageUrl,
              transparentImageUrl: p.thumbnail || p.imageUrl,
              price: p.price,
              _source: 'serp',
            }));
            allItems = [...allItems, ...serpItems];
          }
        } catch (e) {
          console.error("SerpAPI feed fetch failed", e);
        }

        setClosetItems(allItems);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setItemsLoading(false);
    }
  };

  // Fetch items by category from backend (auto-seeds from SerpAPI if empty)
  const fetchByCategory = async (category: string) => {
    setSelectedCategory(category);
    if (category === 'All') return;
    
    // Already have items for this category?
    const existing = closetItems.filter(i => i.category === category);
    if (existing.length > 0) return;

    setItemsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/fashion/category/${encodeURIComponent(category)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const newItems = data.data.map((p: any) => ({
          id: p.id,
          name: p.title || p.name,
          brand: p.brand || p.source || 'Fashion',
          category: category,
          imageUrl: p.thumbnail || p.imageUrl,
          transparentImageUrl: p.thumbnail || p.imageUrl,
          price: p.price,
          _source: 'serp',
        }));
        setClosetItems(prev => [...prev, ...newItems]);
      }
    } catch (e) {
      console.error(`Failed to fetch ${category}:`, e);
    } finally {
      setItemsLoading(false);
    }
  };

  // Simple category guesser from product title
  const guessCategoryFromTitle = (title: string): string => {
    const t = title.toLowerCase();
    if (t.includes('shoe') || t.includes('sneaker') || t.includes('boot') || t.includes('sandal')) return 'Shoes';
    if (t.includes('pant') || t.includes('jean') || t.includes('trouser') || t.includes('short')) return 'Bottoms';
    if (t.includes('jacket') || t.includes('coat') || t.includes('hoodie') || t.includes('sweater')) return 'Outerwear';
    if (t.includes('hat') || t.includes('cap') || t.includes('beanie')) return 'Hats';
    if (t.includes('bag') || t.includes('watch') || t.includes('belt') || t.includes('sunglasses')) return 'Accessories';
    return 'Tops';
  };

  const handleTryOn = async (item: any, baseAvatar: string) => {
    if (!baseAvatar) {
      alert('Digital Twin not found. Please create one in Profile.');
      return;
    }

    setActiveItem(item);
    setIsLoading(true);

    try {
      const itemImageUrl = item.transparentImageUrl || item.imageUrl || item.image?.uri || (typeof item.image === 'string' ? item.image : null);
      
      const res = await fetch(`${BACKEND_URL}/api/try-on`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          human_img: baseAvatar,
          garm_img: itemImageUrl, 
          description: item.category || 'clothing'
        }) 
      });
      
      const data = await res.json();
      if (data.success && data.url) {
        setCurrentAvatarUrl(data.url);
      } else {
        alert('Try-on failed: ' + (data.error || 'Unknown error'));
        setActiveItem(null);
      }
    } catch (e) {
      alert('Network error during try-on.');
      setActiveItem(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = () => {
    setActiveItem(null);
    setCurrentAvatarUrl(user?.digitalTwinUrl || null);
  };

  const handleSaveCollection = async () => {
    if (!currentAvatarUrl || !activeItem) {
        alert('Please try on an item first.');
        return;
    }
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/outfits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id, 
          name: `Look with ${activeItem.name || activeItem.brand || 'Item'}`, 
          occasion: 'Virtual Try-On', 
          aiGenerated: true, 
          imageUrl: currentAvatarUrl 
        }),
      });
      const d = await res.json();
      alert(d.success ? '✨ Outfit saved!' : 'Failed to save.');
    } catch (e) {
      alert('Network error while saving look.');
      console.error(e);
    }
  };

  // Computed filtered list
  const filteredItems = closetItems.filter(item => {
    if (selectedCategory === 'All') return true;
    return item.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)'); }}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Model</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="ellipsis-vertical" size={18} color="#000" />
        </TouchableOpacity>
      </View>

      {/* ── Avatar Canvas ── */}
      <View style={styles.canvas}>
        {currentAvatarUrl ? (
          <Image source={{ uri: currentAvatarUrl }} style={styles.avatarImage} resizeMode="contain" />
        ) : (
          <View style={styles.placeholderAvatar}>
             <Ionicons name="body-outline" size={64} color="#CCC" />
             <Text style={{color:'#999', marginTop: 10, fontSize: 13}}>No Digital Twin</Text>
          </View>
        )}

        {/* Loading */}
        {isLoading && (
            <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={styles.loadingText}>Tailoring fit...</Text>
            </View>
        )}

        {/* Floating Tags for applied items */}
        {activeItem && !isLoading && (
           <View style={[styles.floatingTag, { top: '15%', left: 16 }]}>
              <Image source={{ uri: activeItem.transparentImageUrl || activeItem.imageUrl }} style={styles.tagImage} />
              <TouchableOpacity style={styles.tagCloseBtn} onPress={handleRemoveItem}>
                 <Ionicons name="close" size={10} color="#FFF" />
              </TouchableOpacity>
           </View>
        )}
      </View>

      {/* ── Bottom Drawer ── */}
      <View style={styles.bottomDrawer}>
        {/* Filter + Category Row */}
        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.filterChip}>
            <Ionicons name="options-outline" size={14} color="#000" />
            <Text style={styles.filterChipText}>Filter</Text>
          </TouchableOpacity>
          <View style={{flex:1}} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catPill, selectedCategory === cat && styles.catPillActive]}
                onPress={() => fetchByCategory(cat)}
              >
                <Text style={[styles.catPillText, selectedCategory === cat && styles.catPillTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Items Grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemList}>
           {itemsLoading ? (
             <>{[1,2,3,4].map(i => (
               <View key={i} style={styles.itemCard}>
                 <View style={styles.skeletonShimmer} />
               </View>
             ))}</>
           ) : filteredItems.length > 0 ? filteredItems.map((item, idx) => {
               const itemImg = item.transparentImageUrl || item.imageUrl || item.image?.uri || item.image;
               const isSelected = activeItem?.id === item.id;
               return (
                   <TouchableOpacity 
                     key={item.id || idx} 
                     style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                     onPress={() => handleTryOn(item, user?.digitalTwinUrl)}
                     disabled={isLoading}
                   >
                      {itemImg ? <Image source={{ uri: itemImg }} style={styles.itemCardImg} resizeMode="cover" /> : <View style={styles.skeletonShimmer} />}
                   </TouchableOpacity>
               );
           }) : (
             <Text style={{color: '#999', padding: 20, fontSize: 13}}>No items found</Text>
           )}
        </ScrollView>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCollection}>
           <Text style={styles.saveBtnText}>Save collection</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8EBEA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  canvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#FFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
  },
  placeholderAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
      position: 'absolute',
      top: '40%',
      backgroundColor: 'rgba(255,255,255,0.8)',
      padding: 20,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
  },
  loadingText: {
      marginTop: 10,
      fontWeight: '600',
  },
  floatingTag: {
      position: 'absolute',
      width: 40,
      height: 50,
      backgroundColor: '#FFF',
      borderRadius: 8,
      padding: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
  },
  tagImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
  },
  tagCloseBtn: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#FF3B30',
      alignItems: 'center',
      justifyContent: 'center',
  },
  bottomDrawer: {
      backgroundColor: 'transparent',
      paddingBottom: 30,
  },
  filterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 15,
  },
  filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
      borderWidth: 1,
      borderColor: '#E5E5E5',
  },
  filterChipText: {
      fontSize: 13,
      fontWeight: '500',
  },
  catPill: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.5)',
  },
  catPillActive: {
      backgroundColor: '#000',
  },
  catPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#666',
  },
  catPillTextActive: {
      color: '#FFF',
  },
  itemList: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      gap: 12,
  },
  itemCard: {
      width: 76,
      height: 76,
      backgroundColor: '#FFF',
      borderRadius: 14,
      padding: 6,
      borderWidth: 2,
      borderColor: '#F0F0F0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
  },
  skeletonCard: {
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderColor: 'transparent',
      padding: 0,
      overflow: 'hidden',
  },
  skeletonShimmer: {
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(200,200,200,0.4)',
      borderRadius: 10,
  },
  itemCardSelected: {
      borderColor: '#000',
      backgroundColor: '#FFF',
  },
  itemCardImg: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
  },
  saveBtn: {
      backgroundColor: '#1E1E1E',
      marginHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 30,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 15,
  },
  saveBtnText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '600',
  }
});
