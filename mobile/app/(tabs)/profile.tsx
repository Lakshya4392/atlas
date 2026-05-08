import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Dimensions, Image, ActivityIndicator, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

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
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.8}>
            <Ionicons name="settings-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* ── Premium Hero Profile ── */}
        <View style={styles.profileHero}>
          <View style={styles.avatarMain}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{user?.name?.charAt(0) || 'A'}</Text>
            )}
          </View>
          <Text style={styles.profileName}>{user?.name || 'Your Name'}</Text>
          <Text style={styles.profileMeta}>{stats.level} • {stats.streak} Day Streak</Text>
        </View>

        {/* ── Seamless Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.clothesCount}</Text>
            <Text style={styles.statLabel}>PIECES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.outfitsCount}</Text>
            <Text style={styles.statLabel}>OUTFITS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.favoritesCount}</Text>
            <Text style={styles.statLabel}>FAVORITES</Text>
          </View>
        </View>

        {/* ── VIP AI Try-On Card ── */}
        <View style={styles.aiCard}>
          <View style={styles.aiCardLeft}>
            <Text style={styles.aiCardTitle}>Digital Try-On Avatar</Text>
            <Text style={styles.aiCardSub}>Upload a photo to see how AI outfits look on your actual body.</Text>
            <TouchableOpacity style={styles.aiUploadBtn} onPress={handleUpdateAvatar} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.aiUploadBtnText}>{user?.avatar ? 'UPDATE PHOTO' : 'SETUP AVATAR'}</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.aiCardRight}>
            {user?.avatar ? (
               <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
               <Ionicons name="body-outline" size={32} color="#FFF" />
            )}
          </View>
        </View>

        {/* ── Minimalist Menu Lists ── */}
        <View style={styles.listSection}>
          <Text style={styles.listSectionTitle}>EXPLORE</Text>
          <View style={styles.listBlock}>
            {[
              { icon: 'heart-outline', label: 'Wishlist', route: '/wishlist' },
              { icon: 'images-outline', label: 'Inspo Feed', route: '/inspo' },
              { icon: 'airplane-outline', label: 'Trips', route: '/trip-planner' },
              { icon: 'calendar-outline', label: 'History', route: '/calendar-log' },
            ].map((item, i, arr) => (
              <View key={i}>
                <TouchableOpacity style={styles.listRow} onPress={() => router.push(item.route)} activeOpacity={0.7}>
                  <View style={styles.listRowLeft}>
                    <Ionicons name={item.icon as any} size={22} color="#000" />
                    <Text style={styles.listRowText}>{item.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#CCC" />
                </TouchableOpacity>
                {i < arr.length - 1 && <View style={styles.listDivider} />}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.listSection}>
          <Text style={styles.listSectionTitle}>PREFERENCES</Text>
          <View style={styles.listBlock}>
            <View style={styles.listRow}>
              <View style={styles.listRowLeft}>
                <Ionicons name="notifications-outline" size={22} color="#000" />
                <Text style={styles.listRowText}>Daily Reminders</Text>
              </View>
              <Switch value={notifs} onValueChange={setNotifs} trackColor={{ false: '#EEE', true: '#000' }} thumbColor="#fff" />
            </View>
            <View style={styles.listDivider} />
            <View style={styles.listRow}>
              <View style={styles.listRowLeft}>
                <Ionicons name="partly-sunny-outline" size={22} color="#000" />
                <Text style={styles.listRowText}>Weather Insights</Text>
              </View>
              <Switch value={weather} onValueChange={setWeather} trackColor={{ false: '#EEE', true: '#000' }} thumbColor="#fff" />
            </View>
          </View>
        </View>

        <View style={styles.listSection}>
          <View style={styles.listBlock}>
            <TouchableOpacity style={styles.listRow} onPress={() => router.replace('/onboarding')} activeOpacity={0.7}>
              <View style={styles.listRowLeft}>
                <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
                <Text style={[styles.listRowText, { color: '#FF3B30' }]}>Sign Out</Text>
              </View>
            </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -0.5,
  },
  settingsBtn: {
    padding: 4,
  },

  // Premium Hero
  profileHero: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarMain: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarInitials: {
    fontSize: 40,
    fontWeight: '800',
    color: '#000',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  profileMeta: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  // Seamless Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  statItem: {
    alignItems: 'center',
    width: 100,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999',
    marginTop: 4,
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#EAEAEA',
  },

  // VIP AI Card
  aiCard: {
    backgroundColor: '#000',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  aiCardLeft: {
    flex: 1,
    paddingRight: 16,
  },
  aiCardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  aiCardSub: {
    color: '#999',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  aiUploadBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  aiUploadBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 1,
  },
  aiCardRight: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Minimalist Lists
  listSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  listSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#999',
    letterSpacing: 1.5,
    marginBottom: 12,
    paddingLeft: 4,
  },
  listBlock: {
    backgroundColor: '#F9F9F9',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  listRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  listRowText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  listDivider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginLeft: 58, // Align with text
  },

  versionText: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '800',
    color: '#CCC',
    letterSpacing: 2,
    marginTop: 20,
    marginBottom: 40,
  },
});
