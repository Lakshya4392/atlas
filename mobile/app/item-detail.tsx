import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, Image, ActivityIndicator, Platform, Modal
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  
  const [user, setUser] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        setUserId(u.id);
        setUserAvatar(u.avatar);
      }
    };
    fetchUser();
  }, []);

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
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Failed to fetch local item:', e);
      }

      // 3. Try Cached SerpAPI item
      try {
        const response = await fetch(`${BACKEND_URL}/api/fashion/item/${id}`);
        const data = await response.json();
        if (data.success && data.item) {
          setItem(data.item);
          setFav(false);
        }
      } catch (e) {
        console.error('Failed to fetch serpapi item:', e);
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
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} bounces={false}>
        {/* ── Large Full-Bleed Image Area ── */}
        <View style={styles.productImageArea}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveIndex(idx);
            }}
            style={{ width, height: '100%' }}
          >
            {imageSource ? (
              <Image source={imageSource} style={{ width, height: '100%' }} resizeMode="cover" />
            ) : (
              <View style={{ width, height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' }}>
                <Ionicons name="shirt-outline" size={80} color={Colors.border} />
              </View>
            )}
            
            {tryOnResult && (
              <Image source={{ uri: tryOnResult }} style={{ width, height: '100%' }} resizeMode="cover" />
            )}
          </ScrollView>

          {/* Side dots pagination */}
          {tryOnResult && (
            <View style={styles.sideDots}>
              {[0, 1].map(i => (
                <View
                  key={i}
                  style={[
                    styles.sideDot,
                    activeIndex === i && styles.sideDotActive,
                  ]}
                />
              ))}
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,1)']}
            style={styles.imageBottomGradient}
          />

          {/* ── Floating Try-On/Save Button ── */}
          <View style={styles.floatingAction}>
            <TouchableOpacity 
              activeOpacity={0.8}
              disabled={tryOnLoading}
              onPress={async () => {
                if (tryOnResult && activeIndex === 1) {
                  if (!userId) {
                    alert('Please log in to save looks.');
                    return;
                  }
                  try {
                    const outfitName = item.name ? `Try-On: ${item.name}` : 'Virtual Try-On Look';
                    const res = await fetch(`${BACKEND_URL}/api/outfits`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        userId, 
                        name: outfitName, 
                        occasion: 'Virtual Try-On', 
                        aiGenerated: true, 
                        imageUrl: tryOnResult 
                      }),
                    });
                    const d = await res.json();
                    if (d.success) {
                      alert('✨ Look saved to your Outfits!');
                    } else {
                      alert('Failed to save look.');
                    }
                  } catch (e) {
                    alert('Network error while saving look.');
                  }
                  return;
                }

                let currentAvatar = userAvatar;
                if (!currentAvatar) {
                  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.8 });
                  if (result.canceled || !result.assets[0]) return;
                  setTryOnLoading(true);
                  try {
                    const formData = new FormData();
                    formData.append('image', { uri: result.assets[0].uri, type: 'image/jpeg', name: 'avatar.jpg' } as any);
                    const uploadRes = await fetch(`${BACKEND_URL}/api/upload`, { method: 'POST', body: formData });
                    const uploadData = await uploadRes.json();
                    if (!uploadData.success) { alert('Photo upload failed. Please try again.'); setTryOnLoading(false); return; }
                    await fetch(`${BACKEND_URL}/api/user/${userId}/avatar`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatarUrl: uploadData.url }) });
                    currentAvatar = uploadData.url;
                    setUserAvatar(currentAvatar);
                    const updatedUser = { ...user, avatar: currentAvatar };
                    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                    setUser(updatedUser);
                  } catch (e) {
                    alert('Upload failed. Check your connection.'); setTryOnLoading(false); return;
                  }
                } else {
                  setTryOnLoading(true);
                }
                
                try {
                  const itemImageUrl = item.imageUrl || item.image?.uri || (typeof item.image === 'string' ? item.image : null);
                  if (!itemImageUrl) { alert('This item has no image available to try on.'); setTryOnLoading(false); return; }
                  const res = await fetch(`${BACKEND_URL}/api/try-on`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ garm_img: itemImageUrl, human_img: currentAvatar, description: `${item.color || ''} ${item.name}`, category: item.category }) });
                  const data = await res.json();
                  if (data.success && data.url) {
                    setTryOnResult(data.url);
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ x: width, animated: true });
                      setActiveIndex(1);
                    }, 500);
                  } else {
                    alert(data.error || 'Try-on failed. Please try again.');
                  }
                } catch (e) {
                  alert('Network error. Make sure the server is running.');
                } finally {
                  setTryOnLoading(false);
                }
              }}
            >
              <BlurView intensity={60} tint="dark" style={styles.floatingActionBlur}>
                <Ionicons name="sparkles" size={16} color="#fff" />
                <Text style={styles.floatingActionText}>
                  {tryOnResult && activeIndex === 1 ? 'SAVE LOOK' : 'TRY ON'}
                </Text>
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Floating Header ── */}
        <View style={styles.floatingHeader}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <BlurView intensity={80} tint="light" style={styles.headerBtnBlur}>
              <Ionicons name="arrow-back" size={22} color="#000" />
            </BlurView>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setFav(!fav)} activeOpacity={0.7}>
            <BlurView intensity={80} tint="light" style={styles.headerBtnBlur}>
              <Ionicons
                name={fav ? 'heart' : 'heart-outline'}
                size={22}
                color={fav ? '#000' : '#000'}
              />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* ── Product info ── */}
        <View style={styles.infoSection}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.category?.toUpperCase() || 'GENERAL'}</Text>
          </View>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name ? item.name.toUpperCase() : 'UNKNOWN ITEM'}
          </Text>
          <Text style={styles.productBrand}>{item.brand || 'Personal Archive'}</Text>
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
              { label: 'Brand / Source', value: item.brand || item.source || 'Unknown' },
              { label: 'Price', value: item.price || 'N/A' },
              { label: 'Category', value: item.category || 'Unknown' },
              { label: 'Color', value: item.color || 'Unknown' },
              { label: 'Times Worn', value: `${item.wearCount || 0}×` },
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
        <View style={{ height: 40 }} />
      </ScrollView>
      {tryOnLoading && (
        <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: '85%', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 28, overflow: 'hidden', padding: 40, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', shadowColor: '#000', shadowOffset: {width:0, height:20}, shadowOpacity: 0.15, shadowRadius: 30 }}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={{ marginTop: 24, fontSize: 16, fontWeight: '800', letterSpacing: 2, color: '#000' }}>TAILORING FIT...</Text>
              <Text style={{ marginTop: 8, fontSize: 13, color: '#444', textAlign: 'center', lineHeight: 18 }}>AI is analyzing your avatar and fitting the garment perfectly.</Text>
            </View>
          </View>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  floatingHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  headerBtnBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  scroll: { paddingBottom: 0 },

  productImageArea: {
    width: width,
    height: width * 1.3,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  imageBottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  floatingAction: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
  },
  floatingActionBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  floatingActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
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

  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 2,
  },
  productName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
    lineHeight: 32,
  },
  productBrand: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
    marginTop: 4,
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
