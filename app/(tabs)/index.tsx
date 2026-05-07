import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, TextInput, Dimensions, Platform, ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CLOTHING_ITEMS } from '../../constants/data';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#FFFFFF',
  text: '#000000',
  textMuted: '#666666',
  cardBg: '#F5F5F5',
  border: '#EAEAEA',
};

const getBackendUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
};

export default function DashboardScreen() {
  const [items, setItems] = useState<any[]>([]);
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
      const res = await fetch(`${BACKEND_URL}/api/clothes/${id}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items.map((i: any) => ({ ...i, image: { uri: i.imageUrl } })));
      }
    } catch (e) {
      console.error('Dashboard fetch error:', e);
      // Fallback to mock data if server not running
      setItems(CLOTHING_ITEMS);
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
        }
      });
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filtered = items.filter(item =>
    !query ||
    item.name?.toLowerCase().includes(query.toLowerCase()) ||
    item.brand?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ATLA DAILY</Text>
          {userName ? <Text style={styles.headerSub}>Welcome, {userName.split(' ')[0]}</Text> : null}
        </View>

        {/* ── Search Bar ── */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your closet"
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* ── Hero ── */}
        <TouchableOpacity style={styles.heroContainer} activeOpacity={0.9} onPress={() => router.push('/add-item')}>
          <View style={styles.heroImageWrapper}>
            <Image
              source={require('../../assets/images/denim_jacket.png')}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroOverlay}>
              <Text style={styles.heroText}>+ ADD TO CLOSET</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ── Section ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MY WARDROBE</Text>
          <Text style={styles.sectionCount}>{filtered.length} pieces</Text>
        </View>

        {/* ── Loading ── */}
        {loading ? (
          <ActivityIndicator size="large" color="#000" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="shirt-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>YOUR CLOSET IS EMPTY</Text>
            <Text style={styles.emptySub}>Add your first item to get started</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/add-item')}>
              <Text style={styles.emptyBtnText}>ADD ITEM</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── Grid ── */
          <View style={styles.grid}>
            {filtered.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.gridItem}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/item-detail', params: { id: item.id } })}
              >
                <View style={styles.imageCard}>
                  <Image
                    source={item.image}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{item.name?.toUpperCase()}</Text>
                  <Text style={styles.productBrand}>{item.brand}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── FAB: Add Item ── */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-item')} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingBottom: 120 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 4,
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    height: 48,
    backgroundColor: COLORS.bg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    marginBottom: 24,
    marginTop: 12,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text, height: '100%' },
  heroContainer: {
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 20,
    overflow: 'hidden',
    height: width * 0.55,
  },
  heroImageWrapper: { width: '100%', height: '100%', backgroundColor: COLORS.cardBg },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', letterSpacing: 1.5, color: COLORS.text },
  sectionCount: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: (width - 40 - 16) / 2,
    marginBottom: 24,
    marginHorizontal: 4,
  },
  imageCard: {
    width: '100%',
    aspectRatio: 0.85,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  productImage: { width: '100%', height: '100%' },
  productInfo: { paddingHorizontal: 4 },
  productName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 3,
    letterSpacing: 0.5,
    lineHeight: 17,
  },
  productBrand: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
    paddingBottom: 40,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, letterSpacing: 2, marginTop: 8 },
  emptySub: { fontSize: 13, color: COLORS.textMuted },
  emptyBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  emptyBtnText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
