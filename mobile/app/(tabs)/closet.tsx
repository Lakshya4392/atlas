import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Dimensions, Image, ActivityIndicator, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const getBackendUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
};

const CATEGORIES = [
  'Favorite', 'All', 'Casual', 'Work', 'Sport', 'Party'
];

const ItemCard = ({ item, index }: { item: any, index: number }) => {
  const isTall = index % 3 === 0;
  const cardHeight = isTall ? 280 : 220;

  // Simulate some items being favorited for the visual effect in reference
  const isFav = item.favorite || index % 4 === 0;

  return (
    <TouchableOpacity
      style={[styles.itemCard, { height: cardHeight }]}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/item-detail', params: { id: item.id } })}
    >
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : item.image ? (
          <Image source={item.image} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="shirt-outline" size={32} color="#CCC" />
          </View>
        )}
        {isFav && (
          <View style={styles.favBadge}>
            <Ionicons name="heart" size={24} color="#FF3B30" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function ClosetScreen() {
  const [activeTab, setActiveTab] = useState('Clothes');
  const [cat, setCat] = useState('All');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = getBackendUrl();

  useFocusEffect(
    React.useCallback(() => {
      AsyncStorage.getItem('user').then(stored => {
        if (stored) {
          const u = JSON.parse(stored);
          fetch(`${BACKEND_URL}/api/clothes/${u.id}`)
            .then(res => res.json())
            .then(data => {
              if (data.success) setItems(data.items || []);
              else setItems([]);
            })
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
        } else {
          setItems([]);
          setLoading(false);
        }
      });
    }, [])
  );

  const filtered = items.filter(i => {
    if (cat === 'Favorite') return i.favorite;
    if (cat === 'All') return true;
    return i.category?.toLowerCase() === cat.toLowerCase();
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/search')}>
          <Ionicons name="search" size={16} color="#555" />
          <Text style={styles.headerBtnText}>Search</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>Closet</Text>
        
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/add-item')}>
          <Ionicons name="add" size={18} color="#555" />
          <Text style={styles.headerBtnText}>Upload</Text>
        </TouchableOpacity>
      </View>

      {/* ── Segment Toggle ── */}
      <View style={styles.segmentContainer}>
        <View style={styles.segment}>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === 'Clothes' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('Clothes')}
          >
            <Text style={[styles.segmentText, activeTab === 'Clothes' && styles.segmentTextActive]}>Clothes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === 'Collections' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('Collections')}
          >
            <Text style={[styles.segmentText, activeTab === 'Collections' && styles.segmentTextActive]}>Collections</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* ── Category Filters ── */}
        <View style={styles.catWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.catChip, cat === c && styles.catChipActive]}
                onPress={() => setCat(c)}
                activeOpacity={0.7}
              >
                <Text style={[styles.catText, cat === c && styles.catTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Image-Only Masonry Grid ── */}
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="shirt-outline" size={40} color="#CCC" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>NO ITEMS FOUND</Text>
          </View>
        ) : (
          <View style={styles.masonryGrid}>
            <View style={styles.masonryColumn}>
              {filtered.filter((_, i) => i % 2 === 0).map((item, idx) => (
                <ItemCard key={item.id} item={item} index={idx} />
              ))}
            </View>
            <View style={styles.masonryColumn}>
              {filtered.filter((_, i) => i % 2 !== 0).map((item, idx) => (
                <ItemCard key={item.id} item={item} index={idx} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scroll: { paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: '#000',
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  headerBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
  },

  segmentContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 30,
    padding: 4,
    width: 280,
  },
  segmentBtn: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  segmentBtnActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
  },
  segmentTextActive: {
    color: '#000',
    fontWeight: '600',
  },

  catWrapper: { height: 44, marginBottom: 20 },
  catScroll: { paddingHorizontal: 16, gap: 10 },
  catChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  catChipActive: { 
    backgroundColor: '#333',
  },
  catText: { 
    fontSize: 13, 
    fontWeight: '500', 
    color: '#666',
  },
  catTextActive: { 
    color: '#FFF',
    fontWeight: '600',
  },

  masonryGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  masonryColumn: { flex: 1, gap: 12 },
  itemCard: { width: '100%', marginBottom: 4 },
  imageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#FFF',
    backgroundColor: '#EEE',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  favBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: '#888' },
});
