import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, TextInput, Dimensions, Platform, ActivityIndicator, RefreshControl, Animated
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { CLOTHING_ITEMS } from '../../constants/data';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 40 - 16) / 2;

const getBackendUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
};

const ItemCard = ({ item, index }: { item: any, index: number }) => {
  // Staggered height effect for Pinterest style
  const isTall = index % 3 === 0;
  const cardHeight = isTall ? 280 : 220;

  return (
    <TouchableOpacity
      style={[styles.itemCard, { height: cardHeight + 60 }]}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/item-detail', params: { id: item.id } })}
    >
      <View style={[styles.imageContainer, { height: cardHeight }]}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.image} resizeMode="cover" />
        ) : item.image ? (
          <Image source={item.image} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="shirt-outline" size={32} color="#CCC" />
          </View>
        )}
        {item.favorite && (
          <View style={styles.favBadge}>
            <Ionicons name="heart" size={10} color="#000" />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{(item.name || item.title || 'UNKNOWN').toUpperCase()}</Text>
        <Text style={styles.brand}>{item.brand || 'No Brand'}</Text>
      </View>
    </TouchableOpacity>
  );
};

const SkeletonCard = ({ index }: { index: number }) => {
  const animValue = React.useRef(new Animated.Value(0.5)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(animValue, { toValue: 0.5, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const isTall = index % 3 === 0;
  const cardHeight = isTall ? 280 : 220;

  return (
    <View style={[styles.itemCard, { height: cardHeight + 60 }]}>
      <Animated.View style={[styles.imageContainer, { height: cardHeight, backgroundColor: '#E5E5E5', opacity: animValue }]} />
      <View style={styles.info}>
        <Animated.View style={{ width: '80%', height: 12, backgroundColor: '#E5E5E5', borderRadius: 4, opacity: animValue, marginBottom: 6 }} />
        <Animated.View style={{ width: '50%', height: 10, backgroundColor: '#E5E5E5', borderRadius: 4, opacity: animValue }} />
      </View>
    </View>
  );
};

const SkeletonHero = () => {
  const animValue = React.useRef(new Animated.Value(0.5)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(animValue, { toValue: 0.5, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.heroBanner, { opacity: animValue, backgroundColor: '#E5E5E5', marginHorizontal: 20, marginBottom: 32 }]} />
  );
};

export default function DashboardScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(14);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const BACKEND_URL = getBackendUrl();

  const fetchData = async (uid?: string) => {
    const id = uid || userId;
    if (!id) return;
    try {
      // Fetch from the new Personalized SerpAPI Feed instead of mock data
      const res = await fetch(`${BACKEND_URL}/api/fashion/feed/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        const seen = new Set();
        const unique = data.data.filter((item: any) => {
          const key = item.link || item.title || item.id;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setItems(unique);
      } else {
        setItems([]);
      }
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      AsyncStorage.getItem('user').then(stored => {
        if (stored) {
          const u = JSON.parse(stored);
          setUserId(u.id);
          setUserName(u.name || '');
          fetchData(u.id);
        } else {
          setLoading(false);
          setItems([]);
        }
      });
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const allFiltered = items.filter(item => {
    const itemName = item.name || item.title || '';
    return !query ||
      itemName.toLowerCase().includes(query.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(query.toLowerCase()));
  });
  const filtered = allFiltered.slice(0, visibleCount);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ATLA DAILY</Text>
          <Text style={styles.headerSub}>WARDROBE OS</Text>
        </View>

        {/* ── Premium Search Bar Trigger ── */}
        <View style={styles.searchContainer}>
          <TouchableOpacity 
            style={styles.searchBar} 
            activeOpacity={0.9}
            onPress={() => router.push('/search')}
          >
            <Ionicons name="search-outline" size={18} color="#999" />
            <Text style={[styles.searchInput, { color: '#999', paddingTop: Platform.OS === 'ios' ? 0 : 2 }]}>Search brands, styles, colors...</Text>
          </TouchableOpacity>
        </View>

        {/* ── Hero section ── */}
        {loading ? (
          <SkeletonHero />
        ) : filtered.length > 0 ? (
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false} 
            style={styles.heroBannerScroll}
          >
            {filtered.slice(0, 5).map((item, idx) => (
              <TouchableOpacity 
                key={item.id || item.link || `hero-${idx}`}
                style={[styles.heroBanner, { width: width - 40 }]} 
                activeOpacity={0.9} 
                onPress={() => router.push({ pathname: '/item-detail', params: { id: item.id } })}
              >
                <Image 
                  source={{ uri: item.imageUrl || item.thumbnail }} 
                  style={styles.heroImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.5)']}
                  style={StyleSheet.absoluteFillObject}
                />
                <BlurView intensity={30} tint="dark" style={styles.heroOverlay}>
                  <View style={styles.heroContent}>
                    <Text style={styles.heroTag}>TRENDING NOW</Text>
                    <Text style={styles.heroTitle} numberOfLines={1}>{(item.name || item.title || 'STYLE').toUpperCase()}</Text>
                    <Text style={styles.heroSub}>{item.brand || 'Discover this piece'}</Text>
                  </View>
                  <View style={styles.heroBtn}>
                    <Text style={styles.heroBtnText}>VIEW</Text>
                  </View>
                </BlurView>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}

        {/* ── Section ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>DISCOVER</Text>
          <Text style={styles.sectionCount}>{filtered.length} CURATED PIECES</Text>
        </View>

        {/* ── Pinterest Masonry Grid ── */}
        {loading ? (
          <View style={styles.masonryGrid}>
            <View style={styles.masonryColumn}>
              {[0, 2, 4].map(idx => (
                <SkeletonCard key={`skel-${idx}`} index={idx} />
              ))}
            </View>
            <View style={styles.masonryColumn}>
              {[1, 3, 5].map(idx => (
                <SkeletonCard key={`skel-${idx}`} index={idx} />
              ))}
            </View>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="shirt-outline" size={40} color="#CCC" />
            </View>
            <Text style={styles.emptyTitle}>NO ITEMS</Text>
            <Text style={styles.emptySub}>Your closet is empty. Add your first item.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/add-item')}>
              <Text style={styles.emptyBtnText}>ADD PIECE</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.masonryGrid}>
            <View style={styles.masonryColumn}>
              {filtered.filter((_, i) => i % 2 === 0).map((item, idx) => (
                <ItemCard key={item.id || item.link || `col1-${idx}`} item={item} index={idx} />
              ))}
            </View>
            <View style={styles.masonryColumn}>
              {filtered.filter((_, i) => i % 2 !== 0).map((item, idx) => (
                <ItemCard key={item.id || item.link || `col2-${idx}`} item={item} index={idx} />
              ))}
            </View>
          </View>
        )}

        {!loading && filtered.length > 0 && visibleCount < allFiltered.length && (
          <View style={{ alignItems: 'center', marginTop: 24, paddingBottom: 24 }}>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setVisibleCount(prev => prev + 4)}>
              <Text style={styles.emptyBtnText}>LOAD 4 MORE</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/add-item')} 
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingBottom: 120 },
  
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 6,
    color: '#000',
  },
  headerSub: {
    fontSize: 10,
    color: '#999',
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: 2,
  },

  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 20,
    height: 48,
    gap: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#000', fontWeight: '600' },

  heroBannerScroll: {
    marginBottom: 32,
  },
  heroBanner: {
    marginHorizontal: 20,
    height: 240,
    borderRadius: 32,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroContent: {
    gap: 4,
    flex: 1,
    paddingRight: 16,
  },
  heroTag: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    opacity: 0.8,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroSub: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  heroBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBtnText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1.5, color: '#000' },
  sectionCount: { fontSize: 12, color: '#999', fontWeight: '700' },

  masonryGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
  },
  masonryColumn: {
    flex: 1,
    gap: 20,
  },
  itemCard: {
    width: '100%',
    backgroundColor: '#fff',
  },
  imageContainer: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#F9F9F9',
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.sm,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    paddingTop: 12,
    paddingHorizontal: 4,
  },
  name: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  brand: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },

  loader: { paddingTop: 60, alignItems: 'center' },
  empty: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 40,
    gap: 12,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#000', letterSpacing: 2 },
  emptySub: { fontSize: 13, color: '#999', textAlign: 'center' },
  emptyBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 12,
  },
  emptyBtnText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },

  fab: {
    position: 'absolute',
    bottom: 40,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
});
