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
  Colors, FontSize, FontWeight, Spacing, BorderRadius,
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
        // Fetch real stats
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
          // Update user avatar in DB
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

  // mostWorn and favCount now come from real API stats above

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
              <Text style={styles.profileAvatarText}>{user?.name?.charAt(0) || '?'}</Text>
            </View>
          </View>
          <Text style={styles.profileName}>{user?.name || 'Your Name'}</Text>
          <Text style={styles.profileStyle}>{stats.style?.toUpperCase()}</Text>
          <View style={styles.levelRow}>
            <Text style={styles.levelText}>{stats.streak} DAY STREAK · {stats.level}</Text>
          </View>
        </View>
        {/* ── Stats card ── */}
        <View style={styles.statsCard}>
          {[
            { label: 'PIECES', value: stats.clothesCount },
            { label: 'OUTFITS', value: stats.outfitsCount },
            { label: 'FAVORITES', value: stats.favoritesCount },
          ].map((stat, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── AI Avatar Section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI AVATAR</Text>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPreview}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person-outline" size={40} color="#999" />
                  <Text style={styles.avatarPlaceholderText}>No Body Photo</Text>
                </View>
              )}
            </View>
            <View style={styles.avatarInfo}>
              <Text style={styles.avatarHint}>
                Upload a full-body photo for the AI to "try on" clothes on you.
              </Text>
              <TouchableOpacity 
                style={styles.avatarUploadBtn} 
                onPress={handleUpdateAvatar}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="camera" size={16} color="#fff" />
                    <Text style={styles.avatarUploadText}>
                      {user?.avatar ? 'UPDATE PHOTO' : 'UPLOAD PHOTO'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Explore section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EXPLORE</Text>
          <View style={styles.exploreGrid}>
            {[
              { icon: 'heart', label: 'WISHLIST', sub: 'Saved items', route: '/wishlist' },
              { icon: 'images', label: 'INSPO FEED', sub: 'Discover looks', route: '/inspo' },
              { icon: 'airplane', label: 'TRIP PLANNER', sub: 'Pack smart', route: '/trip-planner' },
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
                style={[styles.styleTag, tag === stats.style && styles.styleTagActive]}
              >
                <Text style={[styles.styleTagText, tag === stats.style && styles.styleTagTextActive]}>
                  {tag.toUpperCase()}
                </Text>
                {tag === stats.style && (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Most Worn — removed mock data, show placeholder ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MOST WORN</Text>
          <View style={styles.card}>
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Ionicons name="shirt-outline" size={32} color="#ccc" />
              <Text style={{ fontSize: 12, color: '#999', marginTop: 8, fontWeight: '600' }}>
                Add items to see your most worn pieces
              </Text>
            </View>
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
  
  avatarContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: Spacing.lg,
    gap: Spacing.lg,
    alignItems: 'center',
  },
  avatarPreview: {
    width: 100,
    height: 130,
    borderRadius: 12,
    backgroundColor: '#EAEAEA',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  avatarPlaceholderText: {
    fontSize: 10,
    color: '#999',
    fontWeight: '700',
    textAlign: 'center',
  },
  avatarInfo: {
    flex: 1,
    gap: 12,
  },
  avatarHint: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    fontWeight: '500',
  },
  avatarUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  avatarUploadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
