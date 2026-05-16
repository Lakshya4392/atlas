import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wardrobeAPI } from '../../src/services/api';

const { width } = Dimensions.get('window');
const CARD_W = (width - 54) / 2; // (width - 40 padding - 14 gap) / 2

export default function HomeScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const fetchedFeed = await wardrobeAPI.getFashionFeed(parsedUser.id);
          setItems(fetchedFeed);
        }
      } catch (error) {
        console.error('Failed to load home data', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* ── Header ── */}
          <View style={s.header}>
            <Text style={s.logo}>VEYRA</Text>
            <View style={s.headerIcons}>
              <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/browse')}>
                <Ionicons name="grid-outline" size={19} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity style={s.iconBtn}>
                <Ionicons name="notifications-outline" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Search ── */}
          <TouchableOpacity style={s.search} activeOpacity={0.8} onPress={() => router.push('/search')}>
            <Ionicons name="search-outline" size={18} color="#BBB" />
            <Text style={s.searchTxt}>Search</Text>
          </TouchableOpacity>

          {/* ── Banner ── */}
          <View style={s.banner}>
            <View style={s.bannerContent}>
              <Text style={s.bannerSub}>TODAY ONLY</Text>
              <Text style={s.bannerH}>Organize closet,{'\n'}get AI styling</Text>
              <TouchableOpacity style={s.bannerCta} onPress={() => router.push('/ai-stylist')}>
                <Text style={s.bannerCtaTxt}>Explore now</Text>
                <Ionicons name="arrow-forward" size={13} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={s.bannerImgContainer}>
              <Image
                source={require('../../assets/images/banner_product.png')}
                style={s.bannerImg}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* ── Popular ── */}
          <View style={s.secHead}>
            <Text style={s.secTitle}>Popular</Text>
            <TouchableOpacity onPress={() => router.push('/browse')}>
              <Text style={s.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#1A1A1A" style={{ marginTop: 40 }} />
          ) : items.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="shirt-outline" size={44} color="#DDD" />
              <Text style={s.emptyTxt}>No items found</Text>
            </View>
          ) : (
            <View style={s.grid}>
              {items.map((item, i) => (
                <TouchableOpacity
                  key={`${item.id || i}-${i}`}
                  style={s.card}
                  activeOpacity={0.92}
                  onPress={() => router.push({ pathname: '/item-detail', params: { id: item.id } })}
                >
                  <View style={s.cardImgWrap}>
                    {item.thumbnail ? (
                      <Image source={{ uri: item.thumbnail }} style={s.cardImg} resizeMode="cover" />
                    ) : (
                      <Ionicons name="shirt-outline" size={32} color="#DDD" />
                    )}
                    <TouchableOpacity style={s.heart}>
                      <Ionicons name="heart-outline" size={16} color="#999" />
                    </TouchableOpacity>
                  </View>
                  <Text style={s.cardName} numberOfLines={1}>
                    {item.title || item.name || 'Fashion Item'}
                  </Text>
                  <Text style={s.cardBrand} numberOfLines={1}>
                    {item.brand || item.source || 'VEYRA'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ height: 110 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F6F4' },
  scroll: { paddingHorizontal: 20 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 8 : 18, marginBottom: 22,
  },
  logo: {
    fontSize: 22, fontWeight: '800', color: '#111',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    fontStyle: 'italic',
  },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#EEEDEB',
  },

  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#EEEDEB', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13, marginBottom: 26,
  },
  searchTxt: { fontSize: 15, color: '#BBB' },

  secHead: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  secTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  seeAll: { fontSize: 13, fontWeight: '500', color: '#BBB' },

  banner: {
    backgroundColor: '#E8E4DF',
    borderRadius: 24,
    flexDirection: 'row',
    marginBottom: 28, 
    minHeight: 160,
    borderWidth: 1, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    overflow: 'hidden', // Contains the image cleanly
  },
  bannerContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    zIndex: 2,
  },
  bannerSub: {
    fontSize: 10, fontWeight: '800', color: '#111',
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12,
  },
  bannerH: {
    fontSize: 22, color: '#111',
    lineHeight: 28, marginBottom: 18,
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    fontStyle: 'italic', fontWeight: '600',
  },
  bannerCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#111', alignSelf: 'flex-start',
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24,
  },
  bannerCtaTxt: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  bannerImgContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 140,
  },
  bannerImg: {
    width: '100%', 
    height: '100%',
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: CARD_W, marginBottom: 20 },
  cardImgWrap: {
    width: '100%', height: CARD_W * 1.2,
    backgroundColor: '#EEEDEB', borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden', marginBottom: 8,
  },
  cardImg: { width: '100%', height: '100%' },
  heart: {
    position: 'absolute', top: 10, right: 10,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
  },
  cardName: { fontSize: 13, fontWeight: '600', color: '#222', paddingHorizontal: 2 },
  cardBrand: { fontSize: 12, fontWeight: '400', color: '#BBB', paddingHorizontal: 2, marginTop: 2 },

  empty: { alignItems: 'center', marginTop: 40 },
  emptyTxt: { marginTop: 12, fontSize: 14, color: '#CCC' },
});
