import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, Image, ActivityIndicator, Platform
} from 'react-native';
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

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fav, setFav] = useState(false);
  const [selectedSize, setSelectedSize] = useState('M');
  const BACKEND_URL = getBackendUrl();

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
        }
      } catch (e) {
        console.error('Failed to fetch item details:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.errorText}>Item not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>GO BACK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const outfitsWithItem = OUTFITS.filter(o => o.items.includes(item.id));
  
  // Robust image source resolution
  let imageSource = null;
  if (item.imageUrl && item.imageUrl.trim() !== '') {
    imageSource = { uri: item.imageUrl };
  } else if (item.image) {
    imageSource = item.image;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ITEM DETAIL</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setFav(!fav)} activeOpacity={0.7}>
          <Ionicons
            name={fav ? 'heart' : 'heart-outline'}
            size={22}
            color={fav ? Colors.accent : Colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── Large product image area ── */}
        <View style={styles.productImageArea}>
          {imageSource ? (
            <Image source={imageSource} style={styles.productImage} resizeMode="cover" />
          ) : (
            <Ionicons name="shirt-outline" size={80} color={Colors.border} />
          )}

          {/* Side dots pagination */}
          <View style={styles.sideDots}>
            {[0, 1, 2, 3].map(i => (
              <View
                key={i}
                style={[
                  styles.sideDot,
                  i === 1 && styles.sideDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* ── Product info ── */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.category?.toUpperCase() || 'GENERAL'}</Text>
              </View>
              <Text style={styles.productName}>{item.name?.toUpperCase() || 'UNTITLED'}</Text>
              <Text style={styles.productBrand}>{item.brand || 'Personal Archive'}</Text>
            </View>
            <TouchableOpacity style={styles.wearBtn} activeOpacity={0.85}>
              <Text style={styles.wearBtnText}>WEAR TODAY</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Size selector ── */}
        <View style={styles.sizeSection}>
          <Text style={styles.sizeLabel}>SELECT SIZE</Text>
          <View style={styles.sizeRow}>
            {SIZES.map(size => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.sizeBtn,
                  selectedSize === size && styles.sizeBtnActive,
                  size === 'M' && styles.sizeBtnMid,
                ]}
                onPress={() => setSelectedSize(size)}
                activeOpacity={0.7}
              >
                <Text style={[styles.sizeBtnText, selectedSize === size && styles.sizeBtnTextActive]}>
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Description ── */}
        <View style={styles.descSection}>
          <Text style={styles.descLabel}>DESCRIPTION</Text>
          <Text style={styles.descText}>
            The {item.name} is a wardrobe essential. Crafted for everyday wear with a focus on quality and versatility. Pairs effortlessly with any look in your closet.
          </Text>
        </View>

        {/* ── Details ── */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsLabel}>DETAILS</Text>
          <View style={styles.detailsCard}>
            {[
              { label: 'Brand', value: item.brand || 'Unknown' },
              { label: 'Category', value: item.category || 'Unknown' },
              { label: 'Color', value: item.color || 'Unknown' },
              { label: 'Times Worn', value: `${item.wearCount || 0}×` },
              { label: 'Last Worn', value: item.lastWorn ?? 'Never' },
            ].map((d, i, arr) => (
              <View key={d.label} style={[styles.detailRow, i < arr.length - 1 && styles.detailRowBorder]}>
                <Text style={styles.detailLabel}>{d.label}</Text>
                <Text style={styles.detailValue}>{d.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Tags ── */}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.tagsLabel}>TAGS</Text>
            <View style={styles.tagsList}>
              {item.tags.map((tag: string) => (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Used in outfits ── */}
        {outfitsWithItem.length > 0 && (
          <View style={styles.outfitsSection}>
            <Text style={styles.outfitsLabel}>USED IN {outfitsWithItem.length} OUTFIT{outfitsWithItem.length > 1 ? 'S' : ''}</Text>
            {outfitsWithItem.map((o, i) => (
              <TouchableOpacity
                key={o.id}
                style={[styles.outfitRow, i > 0 && styles.outfitRowBorder]}
                onPress={() => router.push({ pathname: '/outfit-detail', params: { id: o.id } })}
                activeOpacity={0.7}
              >
                <View style={styles.outfitRowLeft}>
                  <View style={styles.outfitRowImages}>
                    {OUTFITS.find(oo => oo.id === o.id)?.items.slice(0, 2).map(itemId => {
                      const piece = CLOTHING_ITEMS.find(c => c.id === itemId);
                      return piece ? (
                        <View key={itemId} style={styles.outfitImageWrap}>
                          <Image source={piece.image} style={styles.outfitImage} resizeMode="cover" />
                        </View>
                      ) : null;
                    })}
                  </View>
                  <View>
                    <Text style={styles.outfitRowName}>{o.name.toUpperCase()}</Text>
                    <Text style={styles.outfitRowOcc}>{o.occasion}</Text>
                  </View>
                </View>
                <View style={styles.outfitRowRight}>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bottom spacer */}
        <View style={{ height: Spacing['4xl'] }} />
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },

  scroll: { paddingBottom: 100 },

  productImageArea: {
    width: '100%',
    height: width * 1.1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  sideDots: {
    position: 'absolute',
    right: Spacing.xl,
    top: '50%',
    gap: 6,
    transform: [{ translateY: -30 }],
  },
  sideDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.border,
  },
  sideDotActive: {
    width: 5,
    height: 18,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },

  infoCard: {
    marginHorizontal: Spacing['2xl'],
    marginTop: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.lg,
  },
  infoLeft: {
    flex: 1,
    gap: Spacing.sm,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  tagText: {
    fontSize: FontSize['2xs'] ?? 10,
    color: Colors.accent,
    fontWeight: FontWeight.black,
    letterSpacing: 1.5,
  },
  productName: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    lineHeight: 28,
  },
  productBrand: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: FontWeight.regular,
  },
  wearBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  wearBtnText: {
    fontSize: FontSize.sm,
    color: '#fff',
    fontWeight: FontWeight.black,
    letterSpacing: 1,
  },

  sizeSection: {
    marginTop: Spacing['2xl'],
    paddingHorizontal: Spacing['2xl'],
  },
  sizeLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  sizeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  sizeBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  sizeBtnActive: {
    borderColor: Colors.accent,
    borderWidth: 2,
  },
  sizeBtnMid: {
    backgroundColor: Colors.accent + '08',
  },
  sizeBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  sizeBtnTextActive: {
    color: Colors.accent,
    fontWeight: FontWeight.black,
  },

  descSection: {
    marginTop: Spacing['2xl'],
    paddingHorizontal: Spacing['2xl'],
  },
  descLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  descText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 24,
    fontWeight: FontWeight.regular,
  },

  detailsSection: {
    marginTop: Spacing['2xl'],
    paddingHorizontal: Spacing['2xl'],
  },
  detailsLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.regular,
  },
  detailValue: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
    textTransform: 'capitalize',
  },

  tagsSection: {
    marginTop: Spacing['2xl'],
    paddingHorizontal: Spacing['2xl'],
  },
  tagsLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tagPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundAlt,
  },
  tagText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.5,
  },

  outfitsSection: {
    marginTop: Spacing['2xl'],
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing['2xl'],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  outfitsLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    padding: Spacing.lg,
    backgroundColor: Colors.backgroundAlt,
  },
  outfitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  outfitRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  outfitRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  outfitRowImages: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  outfitImageWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  outfitImage: {
    width: '100%',
    height: '100%',
  },
  outfitRowName: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.5,
  },
  outfitRowOcc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  outfitRowRight: {},
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    fontWeight: FontWeight.bold,
  },
  backBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: FontWeight.black,
    fontSize: FontSize.sm,
    letterSpacing: 1,
  },
});
