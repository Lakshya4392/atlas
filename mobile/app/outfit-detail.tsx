import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { OUTFITS, CLOTHING_ITEMS } from '../constants/data';

const { width } = Dimensions.get('window');

const getBackendUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
};

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [outfit, setOutfit] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = getBackendUrl();

  useEffect(() => {
    const fetchOutfit = async () => {
      // 1. Try mock data first
      const mockOutfit = OUTFITS.find(o => o.id === id);
      if (mockOutfit) {
        setOutfit(mockOutfit);
        setItems(CLOTHING_ITEMS.filter(c => mockOutfit.items.includes(c.id)));
        setLoading(false);
        return;
      }

      // 2. Try Backend API
      try {
        const response = await fetch(`${BACKEND_URL}/api/outfits/outfit/${id}`);
        const data = await response.json();
        if (data.success && data.outfit) {
          setOutfit(data.outfit);
          const mappedItems = (data.outfit.items || []).map((i: any) => ({
            ...i.clothingItem,
            id: i.clothingItem.id,
            name: i.clothingItem.name,
            imageUrl: i.clothingItem.imageUrl,
            brand: i.clothingItem.brand,
            color: i.clothingItem.color,
            tags: i.clothingItem.tags || [],
            wearCount: i.clothingItem.wearCount || 0
          }));
          setItems(mappedItems);
        }
      } catch (error) {
        console.error('Fetch outfit error', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOutfit();
  }, [id]);

  if (loading) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color="#000" /></View>;
  if (!outfit) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><Text>Outfit not found</Text></View>;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>OUTFIT</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="share-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroImages}>
            {outfit.imageUrl ? (
              <View style={[styles.heroBox, { width: 200, height: 250 }]}>
                <Image source={{ uri: outfit.imageUrl }} style={styles.heroImage} resizeMode="cover" />
              </View>
            ) : (
              items.map((item, i) => (
                <View key={item.id} style={styles.heroBox}>
                  <Image source={item.imageUrl ? { uri: item.imageUrl } : item.image} style={styles.heroImage} resizeMode="cover" />
                </View>
              ))
            )}
          </View>
          {outfit.aiGenerated && (
            <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>✦ AI GENERATED</Text></View>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.outfitName}>{(outfit.name || 'Outfit').toUpperCase()}</Text>

          {/* Meta */}
          <View style={styles.metaRow}>
            {[
              { icon: 'briefcase-outline', text: outfit.occasion || 'General' },
              { icon: 'calendar-outline', text: outfit.date || 'Saved' },
            ].map((m, i) => (
              <View key={i} style={styles.metaChip}>
                <Ionicons name={m.icon as any} size={12} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{m.text}</Text>
              </View>
            ))}
          </View>

          {/* Rating */}
          <View style={styles.ratingCard}>
            <Text style={styles.ratingLabel}>RATING</Text>
            <View style={styles.ratingRight}>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Ionicons key={s} name={s <= Math.floor(outfit.rating || 5) ? 'star' : 'star-outline'} size={18} color={Colors.accent} />
                ))}
              </View>
              <Text style={styles.ratingValue}>{outfit.rating || 5}/5</Text>
            </View>
          </View>

          {/* Pieces */}
          <Text style={styles.piecesTitle}>PIECES ({items.length})</Text>
          <View style={styles.piecesList}>
            {items.map((item, i) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.pieceRow, i > 0 && styles.pieceRowBorder]}
                onPress={() => router.push({ pathname: '/item-detail', params: { id: item.id } })}
              >
                <View style={styles.pieceImageWrap}>
                  <Image source={item.imageUrl ? { uri: item.imageUrl } : item.image} style={styles.pieceImage} resizeMode="cover" />
                </View>
                <View style={styles.pieceInfo}>
                  <Text style={styles.pieceName}>{(item.name || 'Item').toUpperCase()}</Text>
                  <Text style={styles.pieceBrand}>{item.brand} · {item.color}</Text>
                  <View style={styles.pieceTags}>
                    {(item.tags || []).slice(0, 2).map((t: string) => (
                      <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
                    ))}
                  </View>
                </View>
                <View style={styles.pieceRight}>
                  <Text style={styles.wearCount}>×{item.wearCount}</Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.textLight} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.wearBtn} onPress={() => router.back()}>
          <Text style={styles.wearBtnText}>WEAR THIS OUTFIT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  headerTitle: { fontSize: FontSize.xs, color: Colors.textPrimary, fontWeight: FontWeight.black, letterSpacing: 3 },
  scroll: { paddingBottom: 100 },
  hero: {
    backgroundColor: Colors.backgroundAlt, padding: Spacing['3xl'],
    alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border, position: 'relative',
  },
  heroImages: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap', justifyContent: 'center' },
  heroBox: { width: 100, height: 100, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  aiBadge: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: BorderRadius.xs,
  },
  aiBadgeText: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.black, letterSpacing: 1.5 },
  body: { padding: Spacing['2xl'], gap: Spacing.xl },
  outfitName: { fontSize: FontSize['3xl'], color: Colors.textPrimary, fontWeight: FontWeight.black, letterSpacing: 0.5, lineHeight: 34 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border,
  },
  metaText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  ratingCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.surface, padding: Spacing.lg, borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  ratingLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold, letterSpacing: 2 },
  ratingRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stars: { flexDirection: 'row', gap: 2 },
  ratingValue: { fontSize: FontSize.lg, color: Colors.accent, fontWeight: FontWeight.black },
  piecesTitle: { fontSize: FontSize.xs, color: Colors.textPrimary, fontWeight: FontWeight.black, letterSpacing: 3 },
  piecesList: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  pieceRow: { flexDirection: 'row', padding: Spacing.lg, alignItems: 'center', gap: Spacing.md },
  pieceRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  pieceImageWrap: { width: 56, height: 56, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5', overflow: 'hidden' },
  pieceImage: { width: '100%', height: '100%' },
  pieceInfo: { flex: 1, gap: 4 },
  pieceName: { fontSize: FontSize.xs, color: Colors.textPrimary, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  pieceBrand: { fontSize: FontSize.xs, color: Colors.textMuted },
  pieceTags: { flexDirection: 'row', gap: 5, marginTop: 3 },
  tag: { backgroundColor: Colors.backgroundAlt, paddingHorizontal: 7, paddingVertical: 2, borderRadius: BorderRadius.xs, borderWidth: 1, borderColor: Colors.border },
  tagText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  pieceRight: { alignItems: 'center', gap: 4 },
  wearCount: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: FontWeight.black },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing['2xl'], backgroundColor: Colors.background,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  wearBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, paddingVertical: Spacing.lg, alignItems: 'center' },
  wearBtnText: { fontSize: FontSize.md, color: '#fff', fontWeight: FontWeight.black, letterSpacing: 3 },
});
