import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  FlatList, ActivityIndicator, Dimensions, Image, Platform, KeyboardAvoidingView, Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';

const { width } = Dimensions.get('window');

const getBackendUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
};

const BRANDS = ['ALL', 'ZARA', 'H&M', 'NIKE', 'ADIDAS', 'GUCCI', 'PRADA', 'VINTAGE'];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeBrand, setActiveBrand] = useState('ALL');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(14);
  const inputRef = useRef<TextInput>(null);
  const BACKEND_URL = getBackendUrl();

  useEffect(() => {
    // Auto-focus the search bar with a slight delay for smooth transition
    setTimeout(() => {
      inputRef.current?.focus();
    }, 400);

    AsyncStorage.getItem('user').then(stored => {
      if (stored) {
        const u = JSON.parse(stored);
        fetch(`${BACKEND_URL}/api/fashion/feed/${u.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data) {
              const seen = new Set();
              const unique = data.data.filter((item: any) => {
                const key = item.link || item.title || item.id;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
              setItems(unique);
            }
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, []);

  const allFiltered = items.filter(item => {
    const searchMatch = !query || 
      (item.name || item.title || '').toLowerCase().includes(query.toLowerCase()) ||
      (item.brand || '').toLowerCase().includes(query.toLowerCase());
      
    const brandMatch = activeBrand === 'ALL' || (item.brand || '').toUpperCase().includes(activeBrand);
    
    return searchMatch && brandMatch;
  });

  const filtered = allFiltered.slice(0, visibleCount);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ── Premium Search Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" style={{ marginLeft: 4 }} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search brands, styles, colors..."
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#CCC" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Brand Filters ── */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {BRANDS.map(b => (
            <TouchableOpacity
              key={b}
              style={[styles.filterChip, activeBrand === b && styles.filterChipActive]}
              onPress={() => {
                setActiveBrand(b);
                setVisibleCount(14); // Reset pagination
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, activeBrand === b && styles.filterTextActive]}>{b}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Results ── */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={48} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>NO RESULTS</Text>
          <Text style={styles.emptySub}>We couldn't find any pieces matching your search.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={(item, idx) => item.id || item.link || `search-${idx}`}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            filtered.length > 0 && visibleCount < allFiltered.length ? (
              <View style={styles.footer}>
                <TouchableOpacity style={styles.loadMoreBtn} onPress={() => setVisibleCount(prev => prev + 14)}>
                  <Text style={styles.loadMoreText}>LOAD MORE</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => {
            const isTall = index % 3 === 0;
            const cardHeight = isTall ? 280 : 220;
            return (
              <TouchableOpacity
                style={[styles.itemCard, { height: cardHeight + 60 }]}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/item-detail', params: { id: item.id } })}
              >
                <View style={[styles.imageContainer, { height: cardHeight }]}>
                  {item.imageUrl || item.thumbnail ? (
                    <Image source={{ uri: item.imageUrl || item.thumbnail }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="shirt-outline" size={32} color="#CCC" />
                    </View>
                  )}
                </View>
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>{(item.name || item.title || 'UNKNOWN').toUpperCase()}</Text>
                  <Text style={styles.brand}>{item.brand || 'No Brand'}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    fontWeight: '600',
    height: '100%',
  },
  
  filterWrapper: {
    marginBottom: 20,
    height: 40,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 10,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  filterChipActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  filterText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '800',
    letterSpacing: 1,
  },
  filterTextActive: {
    color: '#FFF',
  },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#000', letterSpacing: 2, marginTop: 16 },
  emptySub: { fontSize: 13, color: '#999', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },

  grid: { paddingHorizontal: 20, paddingBottom: 40 },
  row: { gap: 16, marginBottom: 20 },
  
  itemCard: {
    width: (width - 40 - 16) / 2,
    backgroundColor: '#fff',
  },
  imageContainer: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#F9F9F9',
    overflow: 'hidden',
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

  footer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  loadMoreBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
