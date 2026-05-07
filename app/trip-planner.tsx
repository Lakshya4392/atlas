import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { TRIPS, CLOTHING_ITEMS, TripItem } from '../constants/data';

const { width } = Dimensions.get('window');

export default function TripPlannerScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>TRIP PLANNER</Text>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.7}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── Banner ── */}
        <View style={styles.banner}>
          <LinearGradient colors={['#8B7355', '#A08060']} style={styles.bannerGradient}>
            <Ionicons name="airplane" size={28} color="#fff" />
            <Text style={styles.bannerTitle}>PACK SMART</Text>
            <Text style={styles.bannerSub}>AI generates destination-specific packing lists from your wardrobe.</Text>
          </LinearGradient>
        </View>

        {/* ── Trips ── */}
        <Text style={styles.sectionLabel}>YOUR TRIPS</Text>
        {TRIPS.map(trip => (
          <TouchableOpacity
            key={trip.id}
            style={[styles.tripCard, selected === trip.id && styles.tripCardActive]}
            onPress={() => setSelected(selected === trip.id ? null : trip.id)}
            activeOpacity={0.85}
          >
            <View style={styles.tripTop}>
              <View style={styles.tripLeft}>
                <View style={[styles.tripEmojiBg, { backgroundColor: trip.emoji === '🗼' ? '#8B735515' : trip.emoji === '🗾' ? '#5B8A7215' : '#05966915' }]}>
                  <Text style={styles.tripEmoji}>{trip.emoji}</Text>
                </View>
                <View>
                  <Text style={styles.tripDest}>{trip.destination.toUpperCase()}</Text>
                  <Text style={styles.tripDates}>{trip.dates}</Text>
                </View>
              </View>
              <View style={styles.tripRight}>
                <View style={styles.weatherChip}>
                  <Ionicons name="sunny-outline" size={12} color={Colors.accent} />
                  <Text style={styles.weatherText}>{trip.weather}</Text>
                </View>
                <Ionicons
                  name={selected === trip.id ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.textMuted}
                />
              </View>
            </View>

            {trip.totalItems > 0 && (
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(trip.packedItems / trip.totalItems) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {trip.packedItems}/{trip.totalItems} packed
                </Text>
              </View>
            )}

            {/* ── Expanded packing list ── */}
            {selected === trip.id && (
              <View style={styles.packingList}>
                <View style={styles.packingDivider} />
                <View style={styles.packingHeader}>
                  <Ionicons name="sparkles" size={14} color={Colors.accent} />
                  <Text style={styles.packingTitle}>AI SUGGESTED PACKING LIST</Text>
                </View>
                {CLOTHING_ITEMS.slice(0, 6).map((item, i) => (
                  <View key={item.id} style={styles.packingItem}>
                    <View style={[styles.packingEmoji, { backgroundColor: item.colorHex + '15' }]}>
                      <Text style={styles.packingEmojiText}>{item.image}</Text>
                    </View>
                    <View style={styles.packingInfo}>
                      <Text style={styles.packingName}>{item.name.toUpperCase()}</Text>
                      <Text style={styles.packingBrand}>{item.brand}</Text>
                    </View>
                    <TouchableOpacity style={styles.packCheck} activeOpacity={0.7}>
                      <Ionicons
                        name={i < trip.packedItems ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={i < trip.packedItems ? Colors.success : Colors.textLight}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.generateBtn} activeOpacity={0.8}>
                  <Ionicons name="refresh" size={16} color={Colors.accent} />
                  <Text style={styles.generateBtnText}>REGENERATE WITH AI</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* ── Add trip CTA ── */}
        <TouchableOpacity style={styles.addTripBtn} activeOpacity={0.7}>
          <Ionicons name="add" size={20} color={Colors.accent} />
          <Text style={styles.addTripText}>ADD NEW TRIP</Text>
        </TouchableOpacity>
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: Colors.borderLight },

  scroll: { padding: Spacing['2xl'], paddingBottom: 40, gap: Spacing.xl },

  banner: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  bannerGradient: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  bannerTitle: {
    fontSize: FontSize.xl,
    color: '#fff',
    fontWeight: FontWeight.black,
    letterSpacing: 1,
  },
  bannerSub: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },

  sectionLabel: {
    fontSize: FontSize['2xs'] ?? 10,
    color: Colors.textMuted,
    fontWeight: FontWeight.black,
    letterSpacing: 3,
  },

  tripCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.xs,
  },
  tripCardActive: { borderColor: Colors.accent },
  tripTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  tripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  tripEmojiBg: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tripEmoji: { fontSize: 28 },
  tripDest: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    fontWeight: FontWeight.black,
    letterSpacing: 1,
  },
  tripDates: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tripRight: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  weatherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent + '12',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weatherText: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: FontWeight.medium,
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  progressText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    width: 70,
    textAlign: 'right',
  },

  packingList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  packingDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  packingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  packingTitle: {
    fontSize: FontSize['2xs'] ?? 10,
    color: Colors.textMuted,
    fontWeight: FontWeight.black,
    letterSpacing: 2,
  },
  packingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  packingEmoji: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  packingEmojiText: { fontSize: 22 },
  packingInfo: { flex: 1 },
  packingName: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  packingBrand: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  packCheck: { padding: 4 },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  generateBtnText: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: FontWeight.black,
    letterSpacing: 1.5,
  },

  addTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addTripText: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: FontWeight.bold,
    letterSpacing: 2,
  },
});
