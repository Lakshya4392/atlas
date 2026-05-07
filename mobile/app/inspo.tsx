import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { INSPO_ITEMS, InspoBoardItem } from '../constants/data';

const { width } = Dimensions.get('window');
const CARD = (width - Spacing['2xl'] * 2 - Spacing.md) / 2;

const STYLES = ['ALL', 'MINIMALIST', 'STREETWEAR', 'CASUAL', 'WORK', 'EVENING'];

export default function InspoScreen() {
  const [items, setItems] = useState(INSPO_ITEMS);
  const [filter, setFilter] = useState('ALL');

  const filtered = items.filter(i => filter === 'ALL' || i.style.toUpperCase() === filter);

  const toggleSave = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, saved: !i.saved } : i));
  };

  const renderItem = ({ item, index }: { item: InspoBoardItem; index: number }) => {
    const tall = index % 3 === 0;
    return (
      <TouchableOpacity
        style={[styles.card, { height: tall ? 260 : 200 }]}
        activeOpacity={0.85}
      >
        {/* Gradient color palette bg */}
        <LinearGradient
          colors={[item.colors[0] + '25', item.colors[1] + '15']}
          style={styles.cardBg}
        />
        {/* Emoji */}
        <View style={styles.emojiContainer}>
          <Text style={styles.cardEmoji}>{item.emoji}</Text>
        </View>
        {/* Color swatches */}
        <View style={styles.swatches}>
          {item.colors.map((c, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.swatch, { backgroundColor: c }]}
              activeOpacity={0.7}
            />
          ))}
        </View>
        {/* Overlay info */}
        <View style={styles.cardOverlay}>
          <View style={styles.cardTop}>
            <TouchableOpacity style={styles.saveBtn} onPress={() => toggleSave(item.id)} activeOpacity={0.7}>
              <Ionicons
                name={item.saved ? 'bookmark' : 'bookmark-outline'}
                size={16}
                color={item.saved ? Colors.accent : Colors.textSecondary}
              />
            </TouchableOpacity>
            {item.likes > 1000 && (
              <View style={styles.likesChip}>
                <Ionicons name="heart" size={10} color={Colors.accent} />
                <Text style={styles.likesText}>{(item.likes / 1000).toFixed(1)}k</Text>
              </View>
            )}
          </View>
          <View style={styles.cardBottom}>
            <Text style={styles.cardTitle}>{item.title.toUpperCase()}</Text>
            <Text style={styles.cardStyle}>{item.style}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>INSPO FEED</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.colWrap}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* ── Style filter ── */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>FILTER BY STYLE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {STYLES.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.filterChip, filter === s && styles.filterChipActive]}
                    onPress={() => setFilter(s)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterText, filter === s && styles.filterTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <Text style={styles.countText}>{filtered.length} LOOKS</Text>
          </>
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
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
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
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  divider: { height: 1, backgroundColor: Colors.borderLight },

  listContent: { paddingHorizontal: Spacing['2xl'], paddingBottom: 32 },
  colWrap: { gap: Spacing.md, marginBottom: Spacing.md, alignItems: 'flex-start' },

  card: {
    width: CARD,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.xs,
  },
  cardBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  cardEmoji: {
    fontSize: 64,
    opacity: 0.85,
  },
  swatches: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    gap: 4,
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
  },

  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  saveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  likesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  likesText: {
    fontSize: FontSize['2xs'] ?? 10,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
  },
  cardBottom: {
    gap: 2,
  },
  cardTitle: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.black,
    letterSpacing: 0.5,
  },
  cardStyle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },

  filterSection: {
    paddingTop: Spacing.lg,
  },
  filterLabel: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.black,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing['2xl'],
  },
  filterScroll: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing['2xl'],
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  filterTextActive: { color: '#fff' },
  countText: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: FontWeight.bold,
    letterSpacing: 2,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing['2xl'],
  },
});
