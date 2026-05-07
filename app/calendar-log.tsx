import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { OUTFITS, CLOTHING_ITEMS } from '../constants/data';

const { width } = Dimensions.get('window');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const DAYS_IN_MAY = Array.from({ length: 31 }, (_, i) => i + 1);
const WEEK_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Mock: which days have outfits logged
const LOGGED_DAYS = [1, 2, 3, 5, 6, 7, 8, 10, 12, 13, 14, 15, 17, 19, 20, 21, 22, 24, 25, 26, 27, 28, 29, 30];

export default function CalendarLogScreen() {
  const [selectedDay, setSelectedDay] = useState(6);
  const [selectedMonth, setSelectedMonth] = useState('May');

  const outfit = OUTFITS[selectedDay % OUTFITS.length];
  const pieces = CLOTHING_ITEMS.filter(c => outfit.items.includes(c.id));

  // May 1 2026 starts on Friday (index 5)
  const startOffset = 5;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>WEAR LOG</Text>
        <TouchableOpacity style={styles.statsBtn} activeOpacity={0.7}>
          <Ionicons name="bar-chart-outline" size={20} color={Colors.accent} />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── Month selector ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthScroll}>
          {MONTHS.map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.monthChip, selectedMonth === m && styles.monthChipActive]}
              onPress={() => setSelectedMonth(m)}
              activeOpacity={0.7}
            >
              <Text style={[styles.monthText, selectedMonth === m && styles.monthTextActive]}>{m.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Calendar card ── */}
        <View style={styles.calendarCard}>
          <View style={styles.calHeader}>
            <Text style={styles.calMonth}>{selectedMonth.toUpperCase()} 2026</Text>
            <View style={styles.calLegend}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>Outfit logged</Text>
            </View>
          </View>

          {/* Week labels */}
          <View style={styles.weekRow}>
            {WEEK_LABELS.map((d, i) => (
              <Text key={i} style={styles.weekLabel}>{d}</Text>
            ))}
          </View>

          {/* Days grid */}
          <View style={styles.daysGrid}>
            {Array.from({ length: startOffset }).map((_, i) => (
              <View key={`off-${i}`} style={styles.dayCell} />
            ))}
            {DAYS_IN_MAY.map(day => {
              const hasLog = LOGGED_DAYS.includes(day);
              const isSelected = day === selectedDay;
              const isToday = day === 6;
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                  ]}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dayNum,
                    isSelected && styles.dayNumSelected,
                    isToday && !isSelected && styles.dayNumToday,
                  ]}>{day}</Text>
                  {hasLog && !isSelected && <View style={styles.logDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Selected day detail ── */}
        <View style={styles.dayDetail}>
          <View style={styles.dayDetailHeader}>
            <Text style={styles.dayDetailTitle}>MAY {selectedDay}, 2026</Text>
            {LOGGED_DAYS.includes(selectedDay) ? (
              <View style={styles.loggedBadge}>
                <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                <Text style={styles.loggedText}>LOGGED</Text>
              </View>
            ) : (
              <View style={styles.noLogBadge}>
                <Text style={styles.noLogText}>NO LOG</Text>
              </View>
            )}
          </View>

          {LOGGED_DAYS.includes(selectedDay) ? (
            <>
              <Text style={styles.outfitName}>{outfit.name.toUpperCase()}</Text>
              <Text style={styles.outfitMeta}>{outfit.occasion} · {outfit.weather}</Text>
              <View style={styles.piecesRow}>
                {pieces.map(p => (
                  <View key={p.id} style={[styles.pieceBox, { backgroundColor: p.colorHex + '15' }]}>
                    <Text style={styles.pieceEmoji}>{p.image}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Ionicons
                    key={s}
                    name={s <= Math.floor(outfit.rating) ? 'star' : 'star-outline'}
                    size={16}
                    color={Colors.accent}
                  />
                ))}
                <Text style={styles.ratingText}>{outfit.rating}/5</Text>
              </View>
            </>
          ) : (
            <View style={styles.noLogContent}>
              <Text style={styles.noLogEmoji}>📅</Text>
              <Text style={styles.noLogMsg}>No outfit logged for this day</Text>
              <TouchableOpacity style={styles.logBtn} activeOpacity={0.8}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.logBtnText}>LOG AN OUTFIT</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Monthly stats ── */}
        <Text style={styles.sectionLabel}>MAY STATS</Text>
        <View style={styles.statsCard}>
          {[
            { label: 'DAYS LOGGED', value: LOGGED_DAYS.length },
            { label: 'CURRENT STREAK', value: '14🔥' },
            { label: 'UNIQUE OUTFITS', value: 4 },
          ].map((s, i, arr) => (
            <View key={i} style={[styles.statItem, i < arr.length - 1 && styles.statBorder]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DAY_SIZE = (width - Spacing['2xl'] * 2 - Spacing.md * 6) / 7;

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
  statsBtn: {
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

  scroll: { padding: Spacing['2xl'], paddingBottom: 40, gap: Spacing.xl },

  monthScroll: { gap: Spacing.sm, paddingBottom: Spacing.md },
  monthChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  monthChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  monthText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.bold, letterSpacing: 2 },
  monthTextActive: { color: '#fff' },

  calendarCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  calMonth: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.black,
    letterSpacing: 2,
  },
  calLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  legendText: { fontSize: FontSize['2xs'] ?? 10, color: Colors.textMuted },

  weekRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  weekLabel: {
    width: DAY_SIZE,
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.bold,
  },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: Colors.accent,
    borderRadius: DAY_SIZE / 2,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderRadius: DAY_SIZE / 2,
  },
  dayNum: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  dayNumSelected: { color: '#fff', fontWeight: FontWeight.black },
  dayNumToday: { color: Colors.accent, fontWeight: FontWeight.bold },
  logDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textSecondary,
  },

  dayDetail: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.xs,
  },
  dayDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayDetailTitle: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontWeight: FontWeight.black,
    letterSpacing: 1,
  },
  loggedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  loggedText: { fontSize: FontSize['2xs'] ?? 9, color: Colors.success, fontWeight: FontWeight.black, letterSpacing: 1 },
  noLogBadge: {
    backgroundColor: Colors.backgroundAlt,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  noLogText: { fontSize: FontSize['2xs'] ?? 9, color: Colors.textMuted, fontWeight: FontWeight.black, letterSpacing: 1 },

  outfitName: {
    fontSize: FontSize['xl'],
    color: Colors.textPrimary,
    fontWeight: FontWeight.black,
    letterSpacing: 0.5,
  },
  outfitMeta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  piecesRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  pieceBox: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pieceEmoji: { fontSize: 28 },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  ratingText: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.semibold, marginLeft: 4 },

  noLogContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  noLogEmoji: { fontSize: 48 },
  noLogMsg: { fontSize: FontSize.md, color: Colors.textSecondary },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  logBtnText: {
    fontSize: FontSize.sm,
    color: '#fff',
    fontWeight: FontWeight.black,
    letterSpacing: 1,
  },

  sectionLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.black,
    letterSpacing: 3,
  },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: 6,
  },
  statBorder: { borderRightWidth: 1, borderRightColor: Colors.borderLight },
  statValue: {
    fontSize: FontSize['2xl'],
    color: Colors.textPrimary,
    fontWeight: FontWeight.black,
  },
  statLabel: {
    fontSize: FontSize['2xs'] ?? 10,
    color: Colors.textMuted,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});
