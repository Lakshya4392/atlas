import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, TextInput, Dimensions, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CLOTHING_ITEMS } from '../../constants/data';

const { width } = Dimensions.get('window');

// FEAR OF GOD Aesthetic constants
const COLORS = {
  bg: '#FFFFFF',
  text: '#000000',
  textMuted: '#666666',
  cardBg: '#F5F5F5',
  border: '#EAEAEA',
};

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* ── Minimalist Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ATLA DAILY</Text>
        </View>

        {/* ── Search Bar ── */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        {/* ── Hero Image Section ── */}
        <TouchableOpacity style={styles.heroContainer} activeOpacity={0.9}>
          <View style={styles.heroImageWrapper}>
            <Image 
              source={require('../../assets/images/denim_jacket.png')} 
              style={styles.heroImage} 
              resizeMode="cover"
            />
            <View style={styles.heroOverlay}>
              <Text style={styles.heroText}>ARCHIVE COLLECTION</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ── Category Section: OUTERWEAR ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>OUTERWEAR</Text>
        </View>

        {/* ── Clothing Grid ── */}
        <View style={styles.grid}>
          {CLOTHING_ITEMS.map((item, index) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.gridItem}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/item-detail', params: { id: item.id } })}
            >
              {/* Product Image Card */}
              <View style={styles.imageCard}>
                <Image 
                  source={item.image} 
                  style={styles.productImage} 
                  resizeMode="contain"
                />
              </View>
              {/* Product Info */}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.name.toUpperCase()}</Text>
                <Text style={styles.productBrand}>{item.brand}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 4,
    color: COLORS.text,
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
    marginBottom: 32,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    height: '100%',
  },
  heroContainer: {
    marginHorizontal: 24,
    marginBottom: 40,
    borderRadius: 20,
    overflow: 'hidden',
    height: width * 0.7, // Keeps a nice cinematic ratio
  },
  heroImageWrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.cardBg,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 20,
  },
  heroText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: COLORS.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: (width - 40 - 16) / 2, // 2 columns with 16px gap
    marginBottom: 32,
    marginHorizontal: 4,
  },
  imageCard: {
    width: '100%',
    aspectRatio: 0.85,
    backgroundColor: COLORS.cardBg,
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
  productInfo: {
    paddingHorizontal: 4,
  },
  productName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  productBrand: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
});
