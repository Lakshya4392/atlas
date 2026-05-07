import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { WISHLIST_ITEMS, WishlistItem } from '../constants/data';

const { width } = Dimensions.get('window');
const CARD = (width - Spacing['2xl'] * 2 - Spacing.md) / 2;

export default function WishlistScreen() {
  const [items, setItems] = useState(WISHLIST_ITEMS);

  const toggleSave = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, saved: !i.saved } : i));
  };

  const renderItem = ({ item }: { item: WishlistItem }) => (
    <View style={styles.card}>
      <View style={styles.cardImg}>
        <LinearGradient
          colors={['#F9F8F6', '#F0EDE6']}
          style={styles.cardImgGradient}
        />
        <Text style={styles.cardEmoji}>{item.image}</Text>
        <TouchableOpacity style={styles.heartBtn} onPress={() => toggleSave(item.id)} activeOpacity={0.7}>
          <Ionicons
            name={item.saved ? 'heart' : 'heart-outline'}
            size={17}
            color={item.saved ? Colors.accent : Colors.textMuted}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={2}>{item.name.toUpperCase()}</Text>
        <Text style={styles.cardBrand}>{item.brand}</Text>
        <Text style={styles.cardPrice}>{item.price}</Text>
        <View style={[styles.tryBtn, !item.saved && styles.tryBtnDisabled]}>
          <Ionicons name="eye-outline" size={13} color={item.saved ? '#fff' : Colors.textMuted} />
          <Text style={[styles.tryBtnText, !item.saved && styles.tryBtnTextDisabled]}>
            {item.saved ? 'PREVIEW ON AVATAR' : 'SAVE TO ENABLE'}
          </Text>
        </View>
      </View>
    </View>
  );

  const savedCount = items.filter(i => i.saved).length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>WISHLIST</Text>
        <Text style={styles.count}>{savedCount} saved</Text>
      </View>
      <View style={styles.divider} />

      <FlatList
        data={items}
        numColumns={2}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.colWrap}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.banner}>
            <LinearGradient colors={['#8B7355', '#A08060']} style={styles.bannerGradient}>
              <View style={styles.bannerContent}>
                <Ionicons name="heart" size={24} color="#fff" />
                <View style={styles.bannerTexts}>
                  <Text style={styles.bannerTitle}>YOUR WISHLIST</Text>
                  <Text style={styles.bannerSub}>Save items and preview them on your avatar before buying.</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        }
      />
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
    paddingVertical: Spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.black, letterSpacing: 3 },
  count: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.semibold },
  divider: { height: 1, backgroundColor: Colors.borderLight },

  banner: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  bannerGradient: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing['2xl'],
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bannerTexts: { flex: 1 },
  bannerTitle: {
    fontSize: FontSize.md,
    color: '#fff',
    fontWeight: FontWeight.black,
    letterSpacing: 1,
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
  },

  listContent: { paddingHorizontal: Spacing['2xl'], paddingBottom: 40 },
  colWrap: { gap: Spacing.md, marginBottom: Spacing.md },
  card: {
    width: CARD,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.xs,
  },
  cardImg: {
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  cardImgGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  cardEmoji: { fontSize: 72 },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.xs,
  },
  cardInfo: { padding: Spacing.lg, gap: Spacing.sm },
  cardName: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.bold, letterSpacing: 0.5, lineHeight: 16 },
  cardBrand: { fontSize: FontSize.xs, color: Colors.textSecondary },
  cardPrice: { fontSize: FontSize['lg'], color: Colors.textPrimary, fontWeight: FontWeight.black },
  tryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  tryBtnDisabled: {
    backgroundColor: Colors.backgroundGray,
  },
  tryBtnText: {
    fontSize: FontSize['2xs'] ?? 10,
    color: '#fff',
    fontWeight: FontWeight.black,
    letterSpacing: 1,
  },
  tryBtnTextDisabled: {
    color: Colors.textMuted,
  },
});
