import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width * 0.22;

const getApiUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri || (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    let ip = hostUri.split(':')[0];
    if (Platform.OS === 'android' && (ip === '127.0.0.1' || ip === 'localhost')) ip = '10.0.2.2';
    return `http://${ip}:3000/api`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';
};

const getSectionDefs = (gender: 'Men' | 'Women') => {
  const defs = [
    {
      key: 'Tops', label: 'TOPS',
      subs: gender === 'Men' 
        ? [
            { name: 'Shirts', keywords: ['shirt', 'flannel', 'oxford', 'casual', 'formal'] },
            { name: 'T-Shirts', keywords: ['t-shirt', 'tee', 'graphic', 'oversized'] },
            { name: 'Polo', keywords: ['polo', 'classic'] },
          ]
        : [
            { name: 'Blouses', keywords: ['blouse', 'silk', 'formal'] },
            { name: 'T-Shirts', keywords: ['t-shirt', 'crop top', 'tee'] },
            { name: 'Sweaters', keywords: ['sweater', 'knit', 'cardigan'] },
          ],
    },
    {
      key: 'Bottoms', label: 'BOTTOMS',
      subs: gender === 'Men'
        ? [
            { name: 'Jeans', keywords: ['jean', 'denim', 'slim', 'baggy'] },
            { name: 'Trousers', keywords: ['trouser', 'chino', 'pant'] },
            { name: 'Shorts', keywords: ['short', 'cargo'] },
          ]
        : [
            { name: 'Jeans', keywords: ['jean', 'high-waisted'] },
            { name: 'Skirts', keywords: ['skirt', 'pleated', 'midi', 'mini'] },
            { name: 'Trousers', keywords: ['trouser', 'wide leg', 'pant'] },
          ],
    },
    ...(gender === 'Women' ? [{
      key: 'Dresses', label: 'DRESSES',
      subs: [
        { name: 'Casual', keywords: ['casual', 'floral', 'summer'] },
        { name: 'Evening', keywords: ['evening', 'bodycon', 'gown'] },
      ]
    }] : []),
    {
      key: 'Shoes', label: 'SHOES',
      subs: gender === 'Men'
        ? [
            { name: 'Sneakers', keywords: ['sneaker', 'chunky', 'classic'] },
            { name: 'Loafers', keywords: ['loafer', 'formal', 'suede'] },
            { name: 'Boots', keywords: ['boot'] },
          ]
        : [
            { name: 'Heels', keywords: ['heel', 'stiletto'] },
            { name: 'Sneakers', keywords: ['sneaker', 'casual'] },
            { name: 'Boots', keywords: ['boot'] },
          ],
    },
    {
      key: 'Outerwear', label: 'OUTERWEAR',
      subs: gender === 'Men'
        ? [
            { name: 'Jackets', keywords: ['jacket', 'denim', 'bomber'] },
            { name: 'Coats', keywords: ['coat', 'trench', 'overcoat'] },
            { name: 'Hoodies', keywords: ['hoodie', 'streetwear', 'fleece'] },
          ]
        : [
            { name: 'Jackets', keywords: ['jacket', 'leather', 'denim'] },
            { name: 'Coats', keywords: ['coat', 'trench'] },
          ],
    },
  ];
  
  if (gender === 'Men') {
    defs.push({
      key: 'Hats', label: 'ACCESSORIES',
      subs: [
        { name: 'Caps', keywords: ['cap', 'baseball', 'snapback'] },
        { name: 'Beanies', keywords: ['beanie', 'knit'] },
        { name: 'Hats', keywords: ['fedora', 'hat'] },
      ]
    });
  }
  
  return defs;
};

interface SectionData {
  key: string;
  label: string;
  subs: { name: string; keywords: string[] }[];
  allItems: any[];
}

export default function BrowseScreen() {
  const [gender, setGender] = useState<'Men' | 'Women'>('Men');
  const [sections, setSections] = useState<SectionData[]>([]);
  const [activeSubs, setActiveSubs] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, [gender]); // Reload when gender changes

  const loadAll = async () => {
    setLoading(true);
    const API = getApiUrl();
    const currentDefs = getSectionDefs(gender);
    const fetches = currentDefs.map(async (def) => {
      try {
        const res = await fetch(`${API}/fashion/category/${def.key}?gender=${gender}`);
        if (res.ok) {
          const data = await res.json();
          const items = data.data || data.items || (Array.isArray(data) ? data : []);
          if (items.length > 0) return { ...def, allItems: items } as SectionData;
        }
      } catch (e) { console.log(`Browse: Failed ${def.key}`); }
      return null;
    });
    const results = (await Promise.all(fetches)).filter(Boolean) as SectionData[];
    setSections(results);
    setLoading(false);
  };

  const getDisplayItems = (sec: SectionData, subIdx: number) => {
    const sub = sec.subs[subIdx];
    if (!sub || sub.keywords.length === 0) return sec.allItems;
    const filtered = sec.allItems.filter(item => {
      const text = `${item.title || ''} ${item.query || ''}`.toLowerCase();
      return sub.keywords.some(kw => text.includes(kw));
    });
    return filtered.length > 0 ? filtered : sec.allItems;
  };

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity
            style={s.glassBtn}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
          >
            <Ionicons name="arrow-back" size={20} color="#111" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Browse</Text>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.glassBtn}>
              <Ionicons name="shuffle-outline" size={18} color="#111" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Gender Toggle ── */}
        <View style={s.toggleContainer}>
          <View style={s.toggleBg}>
            <TouchableOpacity 
              style={[s.toggleBtn, gender === 'Men' && s.toggleBtnActive]}
              onPress={() => setGender('Men')}
              activeOpacity={0.8}
            >
              <Text style={[s.toggleText, gender === 'Men' && s.toggleTextActive]}>Men</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[s.toggleBtn, gender === 'Women' && s.toggleBtnActive]}
              onPress={() => setGender('Women')}
              activeOpacity={0.8}
            >
              <Text style={[s.toggleText, gender === 'Women' && s.toggleTextActive]}>Women</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color="#1A1A1A" />
            <Text style={s.loadingText}>Loading fashion...</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
            {sections.map((sec, secIdx) => {
              const subIdx = activeSubs[sec.key] ?? 0;
              const displayItems = getDisplayItems(sec, subIdx);
              const isAlt = secIdx % 2 === 1;

              return (
                <View key={sec.key} style={[s.section, isAlt && s.sectionAlt]}>
                  {/* Category label */}
                  <Text style={s.catLabel}>{sec.label}</Text>

                  {/* Sub tabs — scrollable */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.subsRow}
                    bounces={false}
                  >
                    {sec.subs.map((sub, i) => {
                      const isActive = subIdx === i;
                      return (
                        <TouchableOpacity
                          key={sub.name}
                          onPress={() => setActiveSubs(p => ({ ...p, [sec.key]: i }))}
                          activeOpacity={0.7}
                          style={s.subBtn}
                        >
                          <Text style={[s.subText, isActive && s.subActive]}>{sub.name}</Text>
                          {isActive && <View style={s.subUnderline} />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Items strip */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.itemStrip}
                  >
                    {displayItems.map((item: any, i: number) => (
                      <TouchableOpacity
                        key={item.id || i}
                        activeOpacity={0.9}
                        onPress={() => router.push({ pathname: '/item-detail', params: { id: item.id } })}
                        style={s.itemWrap}
                      >
                        <View style={s.itemCard}>
                          {(item.thumbnail || item.imageUrl) ? (
                            <Image
                              source={{ uri: item.thumbnail || item.imageUrl }}
                              style={s.itemImg}
                              resizeMode="contain"
                            />
                          ) : (
                            <Ionicons name="shirt-outline" size={24} color="#DDD" />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              );
            })}

            {sections.length === 0 && (
              <View style={s.empty}>
                <Ionicons name="shirt-outline" size={48} color="#DDD" />
                <Text style={s.emptyTitle}>No items available</Text>
              </View>
            )}
            <View style={{ height: 80 }} />
          </ScrollView>
        )}

        {/* Bottom FABs */}
        <View style={s.fabRow}>
          <TouchableOpacity style={s.fab} activeOpacity={0.85}>
            <Ionicons name="add" size={24} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.fab}
            activeOpacity={0.85}
            onPress={() => router.push('/dressing-room')}
          >
            <Ionicons name="body-outline" size={22} color="#111" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAFAF8' },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  glassBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },

  // ── Loading ──
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#AAA',
  },

  // ── Toggle ──
  toggleContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  toggleBg: {
    flexDirection: 'row',
    backgroundColor: '#EEEDEB',
    borderRadius: 30,
    padding: 4,
    width: '60%',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 26,
  },
  toggleBtnActive: {
    backgroundColor: '#111',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  toggleTextActive: {
    color: '#FFF',
  },

  // ── Sections ──
  section: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  sectionAlt: {
    backgroundColor: '#F5F5F3',
  },

  catLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BBB',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 10,
  },

  // ── Sub tabs ──
  subsRow: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
    paddingHorizontal: 24,
    marginBottom: 16,
    flexGrow: 1,
  },
  subBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  subText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#CCC',
  },
  subActive: {
    fontWeight: '800',
    color: '#111',
    fontSize: 20,
  },
  subUnderline: {
    height: 2.5,
    backgroundColor: '#111',
    marginTop: 6,
    borderRadius: 2,
    width: '100%',
  },

  // ── Item strip ──
  itemStrip: {
    paddingHorizontal: 20,
    gap: 12,
  },
  itemWrap: {},
  itemCard: {
    width: ITEM_SIZE,
    height: ITEM_SIZE * 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImg: {
    width: '100%',
    height: '100%',
  },

  // ── Empty ──
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 15,
    color: '#CCC',
    fontWeight: '500',
  },

  // ── FABs ──
  fabRow: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 36 : 24,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
});
