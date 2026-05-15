import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, TextInput, Dimensions, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wardrobeAPI, ClothingItem } from '../../src/services/api';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { name: 'All', icon: 'apps' },
  { name: 'Tops', icon: 'shirt' },
  { name: 'Bottoms', icon: 'walk' },
  { name: 'Outerwear', icon: 'snow' },
  { name: 'Shoes', icon: 'footsteps' },
];

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [items, setItems] = useState<any[]>([]); // Using any[] since it's the live feed now
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          // Fetch the live database feed instead of just the user's closet
          const fetchedFeed = await wardrobeAPI.getFashionFeed(parsedUser.id);
          setItems(fetchedFeed);
        }
      } catch (error) {
        console.error('Failed to load home data', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const filteredItems = activeCategory === 'All' 
    ? items 
    : items.filter(item => {
        const title = (item.title || '').toLowerCase();
        if (activeCategory === 'Tops') return title.includes('shirt') || title.includes('top') || title.includes('tee') || title.includes('polo');
        if (activeCategory === 'Bottoms') return title.includes('pant') || title.includes('jeans') || title.includes('short') || title.includes('trousers');
        if (activeCategory === 'Shoes') return title.includes('shoe') || title.includes('sneaker') || title.includes('boot');
        if (activeCategory === 'Outerwear') return title.includes('jacket') || title.includes('coat') || title.includes('hoodie');
        return true;
      });

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.logoText}>VEYRA</Text>
          </View>

          {/* ── Search Bar (Routes to Search) ── */}
          <View style={styles.searchRow}>
            <TouchableOpacity 
              style={styles.searchContainer}
              activeOpacity={0.8}
              onPress={() => router.push('/search')}
            >
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <Text style={styles.searchPlaceholder}>Search</Text>
            </TouchableOpacity>
          </View>

          {/* ── Hero Banner ── */}
          <View style={styles.bannerContainer}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Organize closet,{'\n'}get AI styling</Text>
              <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/ai-stylist')}>
                <Text style={styles.shopBtnText}>Explore now</Text>
                <Ionicons name="arrow-forward" size={14} color="#000" />
              </TouchableOpacity>
            </View>
            <Image
              source={require('../../assets/images/banner_product.png')}
              style={styles.bannerImage}
              resizeMode="contain"
            />
          </View>

          {/* ── Categories ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CATEGORIES.map((cat, index) => {
              const isActive = activeCategory === cat.name;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                  onPress={() => setActiveCategory(cat.name)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.catIconContainer, isActive && styles.catIconContainerActive]}>
                    <Ionicons 
                      name={cat.icon as any} 
                      size={14} 
                      color={isActive ? '#000' : '#888'} 
                    />
                  </View>
                  <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── Grid Section ── */}
          {loading ? (
            <ActivityIndicator size="large" color="#000" style={{ marginTop: 40 }} />
          ) : filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No items found in this category.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {filteredItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id || index.toString()}
                  style={styles.gridItem}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/item-detail', params: { id: item.id } })}
                >
                  <View style={styles.imageWrapper}>
                    {item.thumbnail ? (
                      <Image source={{ uri: item.thumbnail }} style={styles.itemImage} resizeMode="cover" />
                    ) : (
                      <Ionicons name="shirt-outline" size={32} color="#CCC" />
                    )}
                    <TouchableOpacity style={styles.heartBtn}>
                      <Ionicons name="heart-outline" size={18} color="#888" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemBrand}>{item.brand || item.source || 'VEYRA'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Spacer for bottom dock */}
          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    alignItems: 'center', // Centers the logo perfectly
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: Platform.OS === 'ios' ? 10 : 20, // Added spacing to clear notch
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    fontStyle: 'italic',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  bannerContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    overflow: 'hidden',
  },
  bannerContent: {
    flex: 1,
    zIndex: 1,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
    lineHeight: 32,
  },
  shopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shopBtnText: {
    fontWeight: '600',
    marginRight: 6,
  },
  bannerImage: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 150,
    height: 150,
    opacity: 0.9,
  },
  categoriesContainer: {
    marginBottom: 32,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
  },
  categoryChipActive: {
    backgroundColor: '#000',
  },
  catIconContainer: {
    marginRight: 6,
  },
  catIconContainerActive: {},
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryTextActive: {
    color: '#FFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: (width - 60) / 2, // 2 items per row with 20px padding and 20px gap
    marginBottom: 24,
  },
  imageWrapper: {
    width: '100%',
    height: 200, 
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemDetails: {
    paddingHorizontal: 4,
  },
  itemBrand: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
});
