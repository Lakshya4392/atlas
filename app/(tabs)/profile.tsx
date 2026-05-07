import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Dimensions, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius,
} from '../../constants/theme';
import { USER_PROFILE, CLOTHING_ITEMS, WISHLIST_ITEMS, INSPO_ITEMS, TRIPS } from '../../constants/data';

const { width } = Dimensions.get('window');
const STYLE_TAGS = ['Smart Casual', 'Minimalist', 'Streetwear', 'Classic', 'Bohemian', 'Athleisure'];

export default function ProfileScreen() {
  const [notifs, setNotifs] = useState(true);
  const [weather, setWeather] = useState(true);
  const [ai, setAi] = useState(true);
  const mostWorn = [...CLOTHING_ITEMS].sort((a, b) => b.wearCount - a.wearCount).slice(0, 3);
  const favCount = CLOTHING_ITEMS.filter(i => i.favorite).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>PROFILE</Text>
          <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.8}>
            <Ionicons name="settings-outline" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── Profile hero card ── */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatarWrapper}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{USER_PROFILE.name.charAt(0)}</Text>
            </View>
          </View>
          <Text style={styles.profileName}>{USER_PROFILE.name}</Text>
          <Text style={styles.profileStyle}>{USER_PROFILE.style.toUpperCase()}</Text>
          <View style={styles.levelRow}>
            <Text style={styles.levelText}>{USER_PROFILE.streak} DAY STREAK</Text>
          </View>
        </View>
        {/* ── Stats card ── */}
        <View style={styles.statsCard}>
          {[
            { label: 'PIECES', value: USER_PROFILE.closetCount },
            { label: 'OUTFITS', value: USER_PROFILE.outfitCount },
            { label: 'FAVORITES', value: favCount },
          ].map((stat, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Explore section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EXPLORE</Text>
          <View style={styles.exploreGrid}>
            {[
              { icon: 'heart', label: 'WISHLIST', sub: `${WISHLIST_ITEMS.filter(i => i.saved).length} saved`, route: '/wishlist' },
              { icon: 'images', label: 'INSPO FEED', sub: 'Discover looks', route: '/inspo' },
              { icon: 'airplane', label: 'TRIP PLANNER', sub: `${TRIPS.length} trips`, route: '/trip-planner' },
              { icon: 'calendar', label: 'WEAR LOG', sub: 'Your history', route: '/calendar-log' },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.exploreCard}
                onPress={() => router.push(item.route)}
                activeOpacity={0.85}
              >
                <Ionicons name={item.icon as any} size={24} color="#000" style={{ marginBottom: 8 }} />
                <Text style={styles.exploreLabel}>{item.label}</Text>
                <Text style={styles.exploreSub}>{item.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Style Profile ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR STYLE</Text>
          <View style={styles.styleTags}>
            {STYLE_TAGS.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[styles.styleTag, tag === USER_PROFILE.style && styles.styleTagActive]}
              >
                <Text style={[styles.styleTagText, tag === USER_PROFILE.style && styles.styleTagTextActive]}>
                  {tag.toUpperCase()}
                </Text>
                {tag === USER_PROFILE.style && (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Most Worn ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MOST WORN</Text>
          <View style={styles.card}>
            {mostWorn.map((item, i) => (
              <View key={item.id}>
                <TouchableOpacity
                  style={styles.wornRow}
                  onPress={() => router.push({ pathname: '/item-detail', params: { id: item.id } })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.wornRank}>{String(i + 1).padStart(2, '0')}</Text>
                  <View style={styles.wornImageContainer}>
                    <Image source={item.image} style={styles.wornImage} resizeMode="cover" />
                  </View>
                  <View style={styles.wornInfo}>
                    <Text style={styles.wornName}>{item.name.toUpperCase()}</Text>
                    <Text style={styles.wornBrand}>{item.brand}</Text>
                  </View>
                  <Text style={styles.wornCount}>{item.wearCount}×</Text>
                </TouchableOpacity>
                {i < mostWorn.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* ── Preferences ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.card}>
            {[
              { icon: 'notifications-outline', label: 'Daily Outfit Reminders', value: notifs, onChange: setNotifs },
              { icon: 'partly-sunny-outline', label: 'Weather Suggestions', value: weather, onChange: setWeather },
              { icon: 'sparkles-outline', label: 'AI Style Suggestions', value: ai, onChange: setAi },
            ].map((s, i, arr) => (
              <View key={s.label}>
                <View style={styles.settingRow}>
                  <View style={styles.settingLeft}>
                    <Ionicons name={s.icon as any} size={19} color={Colors.textSecondary} />
                    <Text style={styles.settingLabel}>{s.label}</Text>
                  </View>
                  <Switch
                    value={s.value}
                    onValueChange={s.onChange}
                    trackColor={{ false: Colors.border, true: Colors.accent }}
                    thumbColor="#fff"
                    ios_backgroundColor={Colors.border}
                  />
                </View>
                {i < arr.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* ── Menu ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.card}>
            {[
              { icon: 'person-outline', label: 'Edit Profile', danger: false },
              { icon: 'share-social-outline', label: 'Share Wardrobe', danger: false },
              { icon: 'help-circle-outline', label: 'Help & Support', danger: false },
              { icon: 'log-out-outline', label: 'Sign Out', danger: true },
            ].map((item, i, arr) => (
              <View key={item.label}>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => { if (item.label === 'Sign Out') router.replace('/onboarding'); }}
                >
                  <Ionicons name={item.icon as any} size={18} color={item.danger ? Colors.error : Colors.textSecondary} />
                  <Text style={[styles.menuLabel, item.danger && { color: Colors.error }]}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.textLight} />
                </TouchableOpacity>
                {i < arr.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.version}>ALTA DAILY · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 60 },

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
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  profileCard: {
    marginHorizontal: Spacing['2xl'],
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    alignItems: 'center',
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing['3xl'],
    gap: Spacing.sm,
  },
  profileAvatarWrapper: {
    marginBottom: Spacing.sm,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '800',
  },
  profileName: {
    fontSize: 24,
    color: '#000000',
    fontWeight: '800',
    letterSpacing: 1,
  },
  profileStyle: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
    letterSpacing: 1,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  levelText: {
    fontSize: 11,
    color: '#000000',
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  statsCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing['2xl'],
    marginTop: Spacing.lg,
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    color: '#999999',
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  section: {
    paddingHorizontal: Spacing['2xl'],
    marginTop: Spacing['2xl'],
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 1.5,
  },

  exploreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  exploreCard: {
    width: (width - Spacing['2xl'] * 2 - Spacing.md) / 2,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: Spacing.lg,
    gap: 4,
    alignItems: 'center',
  },
  exploreLabel: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  exploreSub: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
  },

  styleTags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  styleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  styleTagActive: {
    backgroundColor: '#000000',
  },
  styleTagText: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '700',
    letterSpacing: 1,
  },
  styleTagTextActive: {
    color: '#FFFFFF',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    overflow: 'hidden',
  },
  wornRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  wornRank: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: FontWeight.black, letterSpacing: 1, width: 24 },
  wornImageContainer: { width: 56, height: 56, borderRadius: BorderRadius.sm, backgroundColor: '#F5F5F5', overflow: 'hidden' },
  wornImage: { width: '100%', height: '100%' },
  wornInfo: { flex: 1, gap: 2 },
  wornName: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  wornBrand: { fontSize: FontSize.xs, color: Colors.textMuted },
  wornCount: { fontSize: FontSize.lg, color: Colors.textPrimary, fontWeight: FontWeight.black },
  rowDivider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.lg },

  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  settingLabel: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  menuLabel: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  version: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textLight, fontWeight: FontWeight.bold, letterSpacing: 3, paddingVertical: Spacing['2xl'] },
});
