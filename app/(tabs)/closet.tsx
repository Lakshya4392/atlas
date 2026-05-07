import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, Dimensions, Image, ActivityIndicator, Platform, RefreshControl
} from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows,
} from '../../constants/theme';
import { CLOTHING_ITEMS, CATEGORIES, ClothingItem } from '../../constants/data';

const { width } = Dimensions.get('window');
const CARD_W = (width - Spacing['2xl'] * 2 - Spacing.md) / 2;

export default function ClosetScreen() {
  const [cat, setCat] = useState('all');
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dynamically resolve the backend URL
  const getBackendUrl = () => {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:3000`;
    }
    return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
  };

  const BACKEND_URL = getBackendUrl();
  const [userId, setUserId] = useState<string | null>(null);

  React.useEffect(() => {
    AsyncStorage.getItem('user').then(stored => {
      if (stored) setUserId(JSON.parse(stored).id);
    });
  }, []);

  const fetchItems = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/clothes/${userId}`);
      const data = await res.json();
      if (data.success) {
        // Map backend items to frontend interface
        const mapped = data.items.map((i: any) => ({
          ...i,
          image: { uri: i.imageUrl },
        }));
        setItems(mapped);
      }
    } catch (error) {
      console.error('Fetch items error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (userId) fetchItems();
    }, [userId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const filtered = items.filter(item => {
    const mc = cat === 'all' || item.category === cat;
    const mq = !query
      || item.name.toLowerCase().includes(query.toLowerCase())
      || (item.brand && item.brand.toLowerCase().includes(query.toLowerCase()));
    return mc && mq;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>MY CLOSET</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-item')} activeOpacity={0.8}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Enhanced search bar ── */}
      <View style={[styles.searchWrapper, isFocused && styles.searchWrapperFocused]}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        {isFocused && (
          <TouchableOpacity style={styles.searchCancel} onPress={() => { setQuery(''); setIsFocused(false); }}>
            <Text style={styles.searchCancelText}>CANCEL</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Category tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catScroll}
        keyboardShouldPersistTaps="handled"
      >
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[styles.catTab, cat === c.id && styles.catTabActive]}
            onPress={() => setCat(c.id)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={c.icon as any}
              size={16}
              color={cat === c.id ? '#FFFFFF' : '#000000'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.catTabText, cat === c.id && styles.catTabTextActive]}>
              {c.name.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Section label ── */}
      <View style={styles.countRow}>
        <Text style={styles.sectionLabel}>
          {cat === 'all' ? 'ALL PIECES' : cat.toUpperCase()}
        </Text>
        <Text style={styles.countText}>{filtered.length}</Text>
      </View>

      {/* ── Grid ── */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>SYNCING YOUR WARDROBE...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({ pathname: '/item-detail', params: { id: item.id } })}
              activeOpacity={0.85}
            >
              {/* Image */}
              <View style={styles.cardImage}>
                <Image source={item.image} style={styles.productImage} resizeMode="contain" />
                {item.favorite && (
                  <View style={styles.heartBadge}>
                    <Ionicons name="heart" size={12} color="#000" />
                  </View>
                )}
              </View>
              {/* Info */}
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={2}>
                  {item.name.toUpperCase()}
                </Text>
                <Text style={styles.cardBrand}>{item.brand}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="shirt-outline" size={48} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>NO ITEMS</Text>
              <Text style={styles.emptySub}>Start building your wardrobe</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/add-item')}>
                <Text style={styles.emptyBtnText}>ADD FIRST PIECE</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },

  searchWrapper: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.xs,
  },
  searchWrapperFocused: {
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  clearBtn: {
    padding: 4,
  },
  searchCancel: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  searchCancelText: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },

  catScroll: {
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  catTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 48, // Fixed height for perfect pill shape
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAEAEA', // Very subtle border
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  catTabActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  catTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 1.5,
  },
  catTabTextActive: {
    color: '#FFFFFF',
  },

  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  countText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },

  grid: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: 32,
  },
  row: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  card: {
    width: CARD_W,
    marginBottom: 32,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 0.85,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  heartBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  cardInfo: {
    paddingHorizontal: 4,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  cardBrand: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },

  empty: {
    alignItems: 'center',
    paddingTop: 100,
    gap: Spacing.md,
    paddingBottom: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  emptySub: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  emptyBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  emptyBtnText: {
    fontSize: FontSize.sm,
    color: '#fff',
    fontWeight: FontWeight.black,
    letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 2,
  },
});
