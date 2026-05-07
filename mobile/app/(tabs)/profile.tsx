import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Dimensions, Image, ActivityIndicator, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows,
} from '../../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const STYLE_TAGS = ['Smart Casual', 'Minimalist', 'Streetwear', 'Classic', 'Bohemian', 'Athleisure'];

const getBackendUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
};

export default function ProfileScreen() {
  const [notifs, setNotifs] = useState(true);
  const [weather, setWeather] = useState(true);
  const [ai, setAi] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({ clothesCount: 0, outfitsCount: 0, favoritesCount: 0, streak: 0, level: 'Style Explorer', style: 'Minimalist' });

  const BACKEND_URL = getBackendUrl();

  React.useEffect(() => {
    const fetchUser = async () => {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        try {
          const res = await fetch(`${BACKEND_URL}/api/user/${u.id}/stats`);
          const data = await res.json();
          if (data.success) setStats(data.stats);
        } catch (e) {
          console.error('Stats fetch error:', e);
        }
      }
    };
    fetchUser();
  }, []);

  const handleUpdateAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('image', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);

        const res = await fetch(`${BACKEND_URL}/api/upload`, {
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const data = await res.json();
        
        if (data.success) {
          const updateRes = await fetch(`${BACKEND_URL}/api/user/${user.id}/avatar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatarUrl: data.url }),
          });
          const updateData = await updateRes.json();
          if (updateData.success) {
            const newUser = { ...user, avatar: data.url };
            await AsyncStorage.setItem('user', JSON.stringify(newUser));
            setUser(newUser);
          }
        }
      } catch (e) {
        console.error('Avatar upload error:', e);
      } finally {
        setUploading(false);
      }
    }
  };

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
        <View style={styles.profileHero}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarMain}>
              <Text style={styles.avatarInitials}>{user?.name?.charAt(0) || '?'}</Text>
            </View>
            <View style={styles.statusDot} />
          </View>
          <Text style={styles.profileName}>{user?.name || 'Your Name'}</Text>
          <View style={styles.styleBadge}>
            <Text style={styles.styleBadgeText}>{stats.style?.toUpperCase()}</Text>
          </View>
          <Text style={styles.streakText}>{stats.streak} DAY STREAK · {stats.level}</Text>
        </View>

        {/* ── Stats bar ── */}
        <View style={styles.statsBar}>
          {[
            { label: 'PIECES', value: stats.clothesCount },
            { label: 'OUTFITS', value: stats.outfitsCount },
            { label: 'FAVORITES', value: stats.favoritesCount },
          ].map((stat, i) => (
            <View key={i} style={styles.statBox}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── AI Try-On Section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI TRY-ON AVATAR</Text>
          </View>
          <View style={styles.aiCard}>
            <View style={styles.aiAvatarPreview}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.aiAvatarImg} />
              ) : (
                <View style={styles.aiAvatarPlaceholder}>
                  <Ionicons name="person-outline" size={32} color="#999" />
                  <Text style={styles.aiPlaceholderText}>NO PHOTO</Text>
                </View>
              )}
            </View>
            <View style={styles.aiAvatarContent}>
              <Text style={styles.aiHintText}>
                Upload a body photo to see how outfits look on you.
              </Text>
              <TouchableOpacity 
                style={styles.aiUploadBtn} 
                onPress={handleUpdateAvatar}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={16} color="#fff" />
                    <Text style={styles.aiUploadBtnText}>
                      {user?.avatar ? 'REPLACE' : 'UPLOAD PHOTO'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Explore Grid ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EXPLORE</Text>
          <View style={styles.exploreGrid}>
            {[
              { icon: 'heart-outline', label: 'WISHLIST', route: '/wishlist' },
              { icon: 'images-outline', label: 'INSPO FEED', route: '/inspo' },
              { icon: 'airplane-outline', label: 'TRIPS', route: '/trip-planner' },
              { icon: 'calendar-outline', label: 'HISTORY', route: '/calendar-log' },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.exploreCard}
                onPress={() => router.push(item.route)}
                activeOpacity={0.85}
              >
                <View style={styles.exploreIconBg}>
                  <Ionicons name={item.icon as any} size={20} color="#000" />
                </View>
                <Text style={styles.exploreLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Preferences ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.menuContainer}>
            {[
              { icon: 'notifications-outline', label: 'Daily Reminders', value: notifs, onChange: setNotifs },
              { icon: 'partly-sunny-outline', label: 'Weather Insights', value: weather, onChange: setWeather },
              { icon: 'sparkles-outline', label: 'AI Recommendations', value: ai, onChange: setAi },
            ].map((s, i, arr) => (
              <View key={s.label}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name={s.icon as any} size={20} color="#000" />
                    <Text style={styles.menuLabelText}>{s.label}</Text>
                  </View>
                  <Switch
                    value={s.value}
                    onValueChange={s.onChange}
                    trackColor={{ false: '#EEE', true: '#000' }}
                    thumbColor="#fff"
                  />
                </View>
                {i < arr.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* ── Settings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.menuContainer}>
            {[
              { icon: 'person-outline', label: 'Edit Profile', danger: false },
              { icon: 'log-out-outline', label: 'Sign Out', danger: true },
            ].map((item, i, arr) => (
              <View key={item.label}>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => { if (item.label === 'Sign Out') router.replace('/onboarding'); }}
                >
                  <Ionicons name={item.icon as any} size={20} color={item.danger ? Colors.error : '#000'} />
                  <Text style={[styles.menuLabelText, item.danger && { color: Colors.error }]}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#CCC" />
                </TouchableOpacity>
                {i < arr.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.versionText}>ALTA DAILY · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
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
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 2,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileHero: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarMain: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  avatarInitials: {
    fontSize: 36,
    color: '#fff',
    fontWeight: '900',
  },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#000',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  styleBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  styleBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#666',
    letterSpacing: 1.5,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 1,
  },

  statsBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing['2xl'],
    backgroundColor: '#000',
    borderRadius: 24,
    padding: 24,
    ...Shadows.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#999',
    letterSpacing: 1.5,
  },

  section: {
    paddingHorizontal: Spacing['2xl'],
    marginTop: 40,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 2,
    marginBottom: 16,
  },

  aiCard: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  aiAvatarPreview: {
    width: 80,
    height: 110,
    borderRadius: 16,
    backgroundColor: '#EEE',
    overflow: 'hidden',
  },
  aiAvatarImg: { width: '100%', height: '100%' },
  aiAvatarPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  aiPlaceholderText: { fontSize: 8, fontWeight: '900', color: '#999' },
  aiAvatarContent: { flex: 1, gap: 12 },
  aiHintText: { fontSize: 13, color: '#666', lineHeight: 20, fontWeight: '500' },
  aiUploadBtn: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  aiUploadBtnText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

  exploreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  exploreCard: {
    width: (width - 48 - 16) / 2,
    backgroundColor: '#F9F9F9',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  exploreIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...Shadows.xs,
  },
  exploreLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },

  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F9F9F9',
    marginHorizontal: 16,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 10,
    color: '#CCC',
    fontWeight: '900',
    letterSpacing: 3,
    marginTop: 60,
    marginBottom: 40,
  },
});
