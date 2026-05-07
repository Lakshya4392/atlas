import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, FlatList, Dimensions, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows,
} from '../../constants/theme';
import { OUTFITS, CLOTHING_ITEMS, Outfit } from '../../constants/data';

const { width } = Dimensions.get('window');
const CARD_W = (width - Spacing['2xl'] * 2 - Spacing.md) / 2;
const OCCASIONS = ['ALL', 'WORK', 'CASUAL', 'EVENING', 'DATE NIGHT'];
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function OutfitsScreen() {
  const [occ, setOcc] = useState('ALL');
  const [tab, setTab] = useState<'outfits' | 'planner'>('outfits');
  const filtered = OUTFITS.filter(o => occ === 'ALL' || o.occasion.toUpperCase() === occ);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>OUTFITS</Text>
        <TouchableOpacity
          style={styles.genBtn}
          onPress={() => router.push('/(tabs)/ai-stylist')}
          activeOpacity={0.8}
        >
          <Ionicons name="sparkles" size={14} color={Colors.accent} />
          <Text style={styles.genBtnText}>AI GENERATE</Text>
        </TouchableOpacity>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabs}>
        {(['outfits', 'planner'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'outfits' ? 'MY COLLECTION' : 'WEEK PLANNER'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'outfits' ? (
        <>
          {/* ── Occasion filter ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.occScroll}
          >
            {OCCASIONS.map(o => (
              <TouchableOpacity
                key={o}
                style={[styles.occChip, occ === o && styles.occChipActive]}
                onPress={() => setOcc(o)}
                activeOpacity={0.7}
              >
                <Text style={[styles.occText, occ === o && styles.occTextActive]}>{o}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Section label ── */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>
              {occ === 'ALL' ? 'ALL LOOKS' : occ}
            </Text>
            <Text style={styles.sectionCount}>{filtered.length}</Text>
          </View>

          {/* ── Grid ── */}
          <FlatList
            data={filtered}
            numColumns={2}
            keyExtractor={i => i.id}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const pieces = CLOTHING_ITEMS.filter(c => item.items.includes(c.id));
              const first = pieces[0];
              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => router.push({ pathname: '/outfit-detail', params: { id: item.id } })}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardImage}>
                    {/* Gradient background */}
                    <LinearGradient
                      colors={['#F9F8F6', '#F0EDE6']}
                      style={styles.cardGradient}
                    />
                    {/* Multi image collage */}
                    <View style={styles.emojiLayout}>
                      {pieces.slice(0, 3).map((p, i) => (
                        <View key={p.id} style={styles.outfitImageWrap}>
                          <Image source={p.image} style={styles.outfitImage} resizeMode="cover" />
                        </View>
                      ))}
                    </View>
                    {item.aiGenerated && (
                      <View style={styles.aiBadge}>
                        <Ionicons name="sparkles" size={10} color="#fff" />
                        <Text style={styles.aiBadgeText}>AI</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {item.name.toUpperCase()}
                    </Text>
                    <Text style={styles.cardOcc}>{item.occasion}</Text>
                    <View style={styles.ratingRow}>
                      <View style={styles.stars}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Ionicons
                            key={s}
                            name={s <= Math.floor(item.rating) ? 'star' : 'star-outline'}
                            size={10}
                            color={Colors.accent}
                          />
                        ))}
                      </View>
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="layers-outline" size={56} color={Colors.textMuted} style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>NO OUTFITS</Text>
                <Text style={styles.emptySub}>Create your first look</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/add-item')}>
                  <Text style={styles.emptyBtnText}>CREATE OUTFIT</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </>
      ) : (
        <ScrollView
          contentContainerStyle={styles.plannerContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.plannerHeader}>
            <Ionicons name="calendar-outline" size={20} color={Colors.accent} />
            <Text style={styles.plannerHeaderText}>WEEKLY OUTFIT SCHEDULE</Text>
          </View>
          {DAYS.map((day, i) => {
            const outfit = OUTFITS[i % OUTFITS.length];
            const isToday = i === 2;
            const pieces = CLOTHING_ITEMS.filter(c => outfit.items.includes(c.id));
            return (
              <TouchableOpacity
                key={day}
                style={[styles.planRow, isToday && styles.planRowToday]}
                activeOpacity={0.8}
              >
                <View style={[styles.dayBox, isToday && styles.dayBoxToday]}>
                  <Text style={[styles.dayText, isToday && styles.dayTextToday]}>{day}</Text>
                </View>
                <View style={[styles.planCard, isToday && styles.planCardToday]}>
                  <View style={styles.planImages}>
                    {pieces.slice(0, 3).map((p, j) => (
                      <View key={j} style={styles.planImageWrap}>
                         <Image source={p.image} style={styles.planImage} resizeMode="cover" />
                      </View>
                    ))}
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={styles.planName}>{outfit.name.toUpperCase()}</Text>
                    <Text style={styles.planOcc}>{outfit.occasion}</Text>
                  </View>
                  {isToday && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayText}>TODAY</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
  genBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.xs,
  },
  genBtnText: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: FontWeight.black,
    letterSpacing: 1,
  },

  tabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing['2xl'],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
  },
  tabTextActive: { color: '#fff' },

  occScroll: {
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  occChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  occChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  occText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  occTextActive: { color: '#fff' },

  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  sectionCount: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },

  grid: { paddingHorizontal: Spacing['2xl'], paddingBottom: 40 },
  row: { gap: Spacing.md, marginBottom: Spacing.lg },

  card: {
    width: CARD_W,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.xs,
  },
  cardImage: {
    height: CARD_W * 1.15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  emojiLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  outfitImageWrap: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  outfitImage: { width: '100%', height: '100%' },
  aiBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  aiBadgeText: {
    fontSize: FontSize['2xs'] ?? 9,
    color: '#fff',
    fontWeight: FontWeight.black,
    letterSpacing: 1,
  },
  cardInfo: {
    padding: Spacing.md,
    gap: 3,
  },
  cardName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  cardOcc: { fontSize: FontSize.xs, color: Colors.textSecondary },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.semibold },

  empty: {
    alignItems: 'center',
    paddingTop: 100,
    gap: Spacing.md,
    paddingBottom: 60,
  },
  emptyIcon: {
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
    backgroundColor: Colors.primary,
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

  // ── Week Planner ──
  plannerContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: 40,
  },
  plannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  plannerHeaderText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dayBox: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayBoxToday: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  dayTextToday: { color: '#fff' },
  planCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  planCardToday: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  planImages: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  planImageWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  planImage: { width: '100%', height: '100%' },
  planInfo: { flex: 1, gap: 2 },
  planName: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  planOcc: {
    fontSize: FontSize['2xs'] ?? 11,
    color: Colors.textSecondary,
  },
  todayBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  todayText: {
    fontSize: FontSize['2xs'] ?? 10,
    color: '#fff',
    fontWeight: FontWeight.black,
    letterSpacing: 1,
  },
});
