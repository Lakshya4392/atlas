import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, Image, ActivityIndicator, Platform, Modal
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows,
} from '../constants/theme';
import { CLOTHING_ITEMS, OUTFITS } from '../constants/data';

const { width } = Dimensions.get('window');

const getBackendUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
};


export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fav, setFav] = useState(false);
  const BACKEND_URL = getBackendUrl();
  
  const [user, setUser] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        setUserId(u.id);
        setUserAvatar(u.avatar);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchItem = async () => {
      // 1. Try mock data first (for legacy items)
      const mockItem = CLOTHING_ITEMS.find(i => i.id === id);
      if (mockItem) {
        setItem(mockItem);
        setFav(mockItem.favorite);
        setLoading(false);
        return;
      }

      // 2. Try API (for newly added items)
      try {
        const response = await fetch(`${BACKEND_URL}/api/clothes/item/${id}`);
        const data = await response.json();
        if (data.success && data.item) {
          setItem(data.item);
          setFav(data.item.favorite);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Failed to fetch local item:', e);
      }

      // 3. Try Cached SerpAPI item
      try {
        const response = await fetch(`${BACKEND_URL}/api/fashion/item/${id}`);
        const data = await response.json();
        if (data.success && data.item) {
          setItem(data.item);
          setFav(false);
        }
      } catch (e) {
        console.error('Failed to fetch serpapi item:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color="#CCC" />
        <Text style={styles.errorText}>Item not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>GO BACK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Robust image source resolution
  let imageSource = null;
  if (item.imageUrl && item.imageUrl.trim() !== '') {
    imageSource = { uri: item.imageUrl };
  } else if (item.image) {
    imageSource = item.image;
  }

  return (
    <View style={styles.container}>
      {/* ── Glassmorphism Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.glassCircle} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity style={styles.glassCircle}>
          <Ionicons name="ellipsis-horizontal" size={18} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} bounces={false}>
        {/* ── Product Image Card ── */}
        <View style={styles.imageCard}>
          <ScrollView
            ref={scrollViewRef}
            horizontal pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 40));
              setActiveIndex(idx);
            }}
            style={{ width: width - 40, height: '100%' }}
          >
            {imageSource ? (
              <Image source={imageSource} style={{ width: width - 40, height: '100%' }} resizeMode="contain" />
            ) : (
              <View style={{ width: width - 40, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="shirt-outline" size={80} color="#DDD" />
              </View>
            )}
            {tryOnResult && (
              <Image source={{ uri: tryOnResult }} style={{ width: width - 40, height: '100%' }} resizeMode="contain" />
            )}
          </ScrollView>
          {tryOnResult && (
            <View style={styles.dotsRow}>
              {[0, 1].map(i => (
                <View key={i} style={[styles.dot, activeIndex === i && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* ── Name + Heart ── */}
        <View style={styles.nameRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName} numberOfLines={2}>{item.name || 'Fashion Item'}</Text>
            <Text style={styles.itemBrand}>{item.brand || item.source || 'Personal Closet'}</Text>
          </View>
          <TouchableOpacity style={styles.glassCircle} onPress={() => setFav(!fav)}>
            <Ionicons name={fav ? 'heart' : 'heart-outline'} size={20} color={fav ? '#FF3B30' : '#888'} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Bottom Action Bar ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.buyBtn}
          activeOpacity={0.8}
          disabled={tryOnLoading}
          onPress={async () => {
            if (tryOnResult && activeIndex === 1) {
              if (!userId) { alert('Please log in.'); return; }
              try {
                const res = await fetch(`${BACKEND_URL}/api/outfits`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId, name: `Try-On: ${item.name}`, occasion: 'Virtual Try-On', aiGenerated: true, imageUrl: tryOnResult }),
                });
                const d = await res.json();
                alert(d.success ? '✨ Look saved!' : 'Failed to save.');
              } catch { alert('Network error.'); }
              return;
            }
            const storedUserStr = await AsyncStorage.getItem('user');
            const freshUser = storedUserStr ? JSON.parse(storedUserStr) : null;
            if (!freshUser?.digitalTwinUrl) { alert('Create a Digital Twin in Profile first!'); return; }
            setTryOnLoading(true);
            try {
              const itemImageUrl = item.transparentImageUrl || item.imageUrl || item.image?.uri;
              if (!itemImageUrl) { alert('No image available.'); setTryOnLoading(false); return; }
              router.push({ pathname: '/dressing-room', params: { itemData: JSON.stringify(item) } });
            } catch (e) { alert('Try-on failed.'); console.error(e); }
            finally { setTryOnLoading(false); }
          }}
        >
          <Ionicons name="sparkles" size={16} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.buyBtnText}>{tryOnResult && activeIndex === 1 ? 'Save Look' : 'Try On'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cartBtn}>
          <Ionicons name="bag-outline" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Loading overlay */}
      {tryOnLoading && (
        <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: '85%', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 28, padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={{ marginTop: 24, fontSize: 16, fontWeight: '800', letterSpacing: 2, color: '#000' }}>TAILORING FIT...</Text>
              <Text style={{ marginTop: 8, fontSize: 13, color: '#444', textAlign: 'center' }}>AI is fitting the garment perfectly.</Text>
            </View>
          </View>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFEFEF' },
  scroll: { paddingBottom: 140 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 14,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 15, fontWeight: '600', color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  glassCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },

  imageCard: {
    marginHorizontal: 20, marginTop: 4,
    height: width * 1.1,
    backgroundColor: '#E3E3E3',
    borderRadius: 32, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
  },
  dotsRow: {
    position: 'absolute', bottom: 18,
    left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.12)' },
  dotActive: { width: 22, backgroundColor: '#1A1A1A', borderRadius: 4 },

  nameRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 28, paddingTop: 28, marginBottom: 4, gap: 12,
  },
  itemName: {
    fontSize: 20, fontWeight: '700', color: '#111',
    letterSpacing: -0.4, lineHeight: 26, marginBottom: 6,
  },
  itemBrand: {
    fontSize: 13, fontWeight: '500', color: '#999',
    letterSpacing: 0.2,
  },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 36 : 22,
    backgroundColor: 'rgba(239,239,239,0.92)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.6)',
    gap: 10,
  },
  buyBtn: {
    flex: 1, flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    paddingVertical: 17, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 10,
  },
  buyBtnText: {
    color: '#FFF', fontSize: 15, fontWeight: '700',
    letterSpacing: 0.5,
  },
  cartBtn: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },

  centered: { alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 14, color: '#888', marginTop: 12, marginBottom: 20, fontWeight: '600' },
  backBtn: { backgroundColor: '#1A1A1A', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  backBtnText: { color: '#FFF', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
});
