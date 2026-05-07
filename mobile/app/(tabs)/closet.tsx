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
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows,
} from '../../constants/theme';
import { CLOTHING_ITEMS, CATEGORIES } from '../../constants/data';

const { width } = Dimensions.get('window');

const getBackendUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
};

const ItemCard = ({ item, index }: { item: any, index: number }) => {
  const isTall = index % 3 === 0;
  const cardHeight = isTall ? 260 : 200;

  return (
    <TouchableOpacity
      style={[styles.itemCard, { height: cardHeight + 60 }]}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/item-detail', params: { id: item.id } })}
    >
      <View style={[styles.imageContainer, { height: cardHeight }]}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
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
        <Text style={styles.name} numberOfLines={1}>{item.name?.toUpperCase()}</Text>
        <Text style={styles.brand}>{item.brand}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function ClosetScreen() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('ALL');
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
              else setItems(CLOTHING_ITEMS);
            })
            .catch(() => setItems(CLOTHING_ITEMS))
            .finally(() => setLoading(false));
        } else {
          setItems(CLOTHING_ITEMS);
          setLoading(false);
        }
      });
    }, [])
  );

  const filtered = items.filter(i => {
    const matchSearch = i.name?.toLowerCase().includes(search.toLowerCase()) || 
                      (i.brand && i.brand.toLowerCase().includes(search.toLowerCase()));
    const matchCat = cat === 'ALL' || i.category?.toUpperCase() === cat;
    return matchSearch && matchCat;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>MY CLOSET</Text>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => router.push('/add-item')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── Search ── */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#999" />
            <TextInput
              placeholder="Search items..."
              placeholderTextColor="#999"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* ── Categories ── */}
        <View style={styles.catWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.catChip, cat === c.name.toUpperCase() && styles.catChipActive]}
                onPress={() => setCat(c.name.toUpperCase())}
                activeOpacity={0.7}
              >
                <Ionicons name={c.icon as any} size={14} color={cat === c.name.toUpperCase() ? '#fff' : '#000'} />
                <Text style={[styles.catText, cat === c.name.toUpperCase() && styles.catTextActive]}>
                  {c.name.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Label ── */}
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>{cat === 'ALL' ? 'ALL PIECES' : cat}</Text>
          <Text style={styles.labelCount}>{filtered.length}</Text>
        </View>

        {/* ── Pinterest Grid ── */}
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="shirt-outline" size={40} color="#CCC" />
            </View>
            <Text style={styles.emptyTitle}>NO ITEMS FOUND</Text>
            <Text style={styles.emptySub}>Try a different search or category.</Text>
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: { fontSize: 24, fontWeight: '900', color: '#000', letterSpacing: 1.5 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },

  searchContainer: { paddingHorizontal: 20, marginTop: 10, marginBottom: 20 },
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

  catWrapper: { height: 44, marginBottom: 24 },
  catScroll: { paddingHorizontal: 20, gap: 12, alignItems: 'center' },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  catChipActive: { backgroundColor: '#000', borderColor: '#000' },
  catText: { fontSize: 11, fontWeight: '800', color: '#666', letterSpacing: 1 },
  catTextActive: { color: '#fff' },

  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  labelText: { fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 1.5 },
  labelCount: { fontSize: 12, color: '#999', fontWeight: '700' },

  masonryGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 16 },
  masonryColumn: { flex: 1, gap: 20 },
  itemCard: { width: '100%', backgroundColor: '#fff' },
  imageContainer: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#F9F9F9',
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.sm,
  },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  info: { paddingTop: 12, paddingHorizontal: 4 },
  name: { fontSize: 12, fontWeight: '900', color: '#000', letterSpacing: 0.5, marginBottom: 2 },
  brand: { fontSize: 11, color: '#999', fontWeight: '600' },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#000', letterSpacing: 2, marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 20 },
});
