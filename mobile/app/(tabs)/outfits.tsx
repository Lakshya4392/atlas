import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, FlatList, Dimensions, Image, ActivityIndicator, Platform, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows,
} from '../../constants/theme';

const { width } = Dimensions.get('window');
const CARD_W = (width - Spacing['2xl'] * 2 - Spacing.md) / 2;
const OCCASIONS = ['ALL', 'WORK', 'CASUAL', 'EVENING', 'DATE NIGHT'];
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const getBackendUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
};

const SkeletonOutfitCard = () => {
  const animValue = React.useRef(new Animated.Value(0.5)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(animValue, { toValue: 0.5, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.cardImage, { backgroundColor: '#E5E5E5', opacity: animValue }]} />
      <View style={styles.cardInfo}>
        <Animated.View style={{ width: '70%', height: 12, backgroundColor: '#E5E5E5', borderRadius: 4, opacity: animValue, marginBottom: 4 }} />
        <Animated.View style={{ width: '40%', height: 10, backgroundColor: '#E5E5E5', borderRadius: 4, opacity: animValue }} />
      </View>
    </View>
  );
};

const SkeletonPlanRow = () => {
  const animValue = React.useRef(new Animated.Value(0.5)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(animValue, { toValue: 0.5, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <View style={styles.planRow}>
      <Animated.View style={[styles.dayBox, { backgroundColor: '#E5E5E5', opacity: animValue }]} />
      <Animated.View style={[styles.planCard, { backgroundColor: '#E5E5E5', borderColor: 'transparent', opacity: animValue, height: 60 }]} />
    </View>
  );
};

export default function OutfitsScreen() {
  const [occ, setOcc] = useState('ALL');
  const [tab, setTab] = useState<'outfits' | 'planner'>('outfits');
  const [outfits, setOutfits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const BACKEND_URL = getBackendUrl();

  useFocusEffect(
    React.useCallback(() => {
      AsyncStorage.getItem('user').then(stored => {
        if (stored) {
          const u = JSON.parse(stored);
          setUserId(u.id);
          fetch(`${BACKEND_URL}/api/outfits/${u.id}`)
            .then(res => res.json())
            .then(data => {
              if (data.success) setOutfits(data.outfits);
            })
            .catch(e => console.error('Outfits fetch error:', e))
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      });
    }, [])
  );

  const filtered = outfits.filter(o => occ === 'ALL' || o.occasion?.toUpperCase() === occ);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>WARDROBE</Text>
          <Text style={styles.subtitle}>Curated Looks</Text>
        </View>
        <TouchableOpacity
          style={styles.genBtn}
          onPress={() => router.push('/(tabs)/ai-stylist')}
          activeOpacity={0.8}
        >
          <Ionicons name="sparkles" size={16} color="#fff" />
          <Text style={styles.genBtnText}>AI STYLIST</Text>
        </TouchableOpacity>
      </View>

      {/* ── Segment Toggle ── */}
      <View style={styles.segmentContainer}>
        <View style={styles.segment}>
          <TouchableOpacity 
            style={styles.segmentBtn}
            onPress={() => router.push('/closet')}
            activeOpacity={0.8}
          >
            <Text style={styles.segmentText}>WARDROBE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segmentBtn, styles.segmentBtnActive]}>
            <Text style={[styles.segmentText, styles.segmentTextActive]}>OUTFITS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          {(['outfits', 'planner'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'outfits' ? 'COLLECTION' : 'PLANNER'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {tab === 'outfits' ? (
        <>
          {/* ── Occasion filter ── */}
          <View style={styles.occFilterWrapper}>
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
          </View>

          {/* ── Section label ── */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>
              {occ === 'ALL' ? 'ALL LOOKS' : occ}
            </Text>
            <Text style={styles.sectionCount}>{filtered.length}</Text>
          </View>

          {/* ── Grid ── */}
          {loading ? (
            <View style={styles.grid}>
              <View style={styles.row}>
                <SkeletonOutfitCard />
                <SkeletonOutfitCard />
              </View>
              <View style={styles.row}>
                <SkeletonOutfitCard />
                <SkeletonOutfitCard />
              </View>
              <View style={styles.row}>
                <SkeletonOutfitCard />
                <SkeletonOutfitCard />
              </View>
            </View>
          ) : (
          <FlatList
            data={filtered}
            numColumns={2}
            keyExtractor={i => i.id}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const pieces = item.items?.map((oi: any) => oi.clothingItem).filter(Boolean) || [];
              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => router.push({ pathname: '/outfit-detail', params: { id: item.id } })}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardImage}>
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <View style={styles.imageGrid}>
                        {pieces.slice(0, 4).map((p: any, i: number) => (
                          <View key={i} style={[styles.imageThumb, pieces.length === 1 && styles.imageThumbFull]}>
                            {p.imageUrl ? (
                              <Image source={{ uri: p.imageUrl }} style={styles.thumbImg} resizeMode="cover" />
                            ) : (
                              <Ionicons name="shirt-outline" size={16} color="#999" />
                            )}
                          </View>
                        ))}
                        {pieces.length === 0 && (
                          <Ionicons name="layers-outline" size={32} color="#ccc" />
                        )}
                      </View>
                    )}
                    {item.aiGenerated && (
                      <View style={styles.aiBadge}>
                        <Ionicons name="sparkles" size={8} color="#000" />
                        <Text style={styles.aiBadgeText}>AI</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName} numberOfLines={1}>{item.name?.toUpperCase()}</Text>
                    <View style={styles.cardMeta}>
                      <Text style={styles.cardOcc}>{item.occasion}</Text>
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={10} color={Colors.accent} />
                        <Text style={styles.ratingText}>{item.rating || 0}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="layers-outline" size={48} color={Colors.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>NO LOOKS YET</Text>
                <Text style={styles.emptySub}>Ask your AI Stylist to curate some looks for you.</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/ai-stylist')}>
                  <Text style={styles.emptyBtnText}>GENERATE OUTFIT</Text>
                </TouchableOpacity>
              </View>
            }
          />
          )}
        </>
      ) : (
        <ScrollView
          contentContainerStyle={styles.plannerContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.plannerHeader}>
            <Ionicons name="calendar-outline" size={20} color={Colors.textPrimary} />
            <Text style={styles.plannerHeaderText}>WEEKLY SCHEDULE</Text>
          </View>
          {loading ? (
            <>
              {[1, 2, 3, 4, 5].map(i => <SkeletonPlanRow key={`skel-plan-${i}`} />)}
            </>
          ) : (
            DAYS.map((day, i) => {
              const outfit = outfits[i % Math.max(outfits.length, 1)];
              const isToday = i === (new Date().getDay() + 6) % 7;
              const pieces = outfit?.items?.map((oi: any) => oi.clothingItem).filter(Boolean) || [];
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
                    {outfit ? (
                      <>
                        <View style={styles.planImages}>
                          {pieces.slice(0, 3).map((p: any, j: number) => (
                            <View key={j} style={styles.planImageWrap}>
                              {p?.imageUrl ? (
                                <Image source={{ uri: p.imageUrl }} style={styles.planImage} resizeMode="cover" />
                              ) : (
                                <Ionicons name="shirt-outline" size={16} color="#999" />
                              )}
                            </View>
                          ))}
                        </View>
                        <View style={styles.planInfo}>
                          <Text style={styles.planName}>{outfit.name?.toUpperCase()}</Text>
                          <Text style={styles.planOcc}>{outfit.occasion}</Text>
                        </View>
                      </>
                    ) : (
                      <Text style={styles.planEmpty}>No outfit planned</Text>
                    )}
                    {isToday && (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayBadgeText}>TODAY</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 1,
  },
  genBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    ...Shadows.md,
  },
  genBtnText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  segmentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  segmentBtnActive: {
    backgroundColor: '#FFF',
    ...Shadows.sm,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#888',
    letterSpacing: 1,
  },
  segmentTextActive: {
    color: '#000',
  },

  tabsContainer: {
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  tabBtnActive: {
    backgroundColor: '#fff',
    ...Shadows.xs,
  },
  tabText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
  },
  tabTextActive: { color: '#000' },

  occFilterWrapper: {
    height: 48,
    marginBottom: Spacing.xl,
  },
  occScroll: {
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.md,
    alignItems: 'center',
  },
  occChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    backgroundColor: '#fff',
  },
  occChipActive: { 
    backgroundColor: '#000', 
    borderColor: '#000',
  },
  occText: {
    fontSize: 11,
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
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 1.5,
  },
  sectionCount: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },

  grid: { paddingHorizontal: 20, paddingBottom: 40 },
  row: { gap: 16, marginBottom: 20 },

  card: {
    width: (width - 40 - 16) / 2,
    backgroundColor: '#fff',
  },
  cardImage: {
    width: '100%',
    aspectRatio: 0.8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    height: '100%',
  },
  imageThumb: {
    width: '50%',
    height: '50%',
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  imageThumbFull: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
  },
  thumbImg: { width: '100%', height: '100%' },
  aiBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    ...Shadows.xs,
  },
  aiBadgeText: {
    fontSize: 8,
    color: '#000',
    fontWeight: FontWeight.black,
    letterSpacing: 1,
  },
  cardInfo: {
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  cardName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardOcc: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: { fontSize: 11, color: Colors.textPrimary, fontWeight: '700' },

  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 3,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  emptyBtnText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: FontWeight.black,
    letterSpacing: 1.5,
  },

  loadingContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },

  // ── Week Planner ──
  plannerContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    paddingBottom: 40,
  },
  plannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  plannerHeaderText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: FontWeight.black,
    letterSpacing: 2,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  planRowToday: {},
  dayBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBoxToday: {
    backgroundColor: '#000',
  },
  dayText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '800',
  },
  dayTextToday: { color: '#fff' },
  planCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  planCardToday: {
    borderColor: '#000',
    borderWidth: 1.5,
  },
  planImages: {
    flexDirection: 'row',
    gap: 4,
  },
  planImageWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  planImage: { width: '100%', height: '100%' },
  planInfo: { flex: 1 },
  planName: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: '800',
    marginBottom: 2,
  },
  planOcc: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  planEmpty: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  todayBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  todayBadgeText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '900',
  },
});
