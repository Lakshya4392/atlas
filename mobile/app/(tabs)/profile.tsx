import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Dimensions, Image, ActivityIndicator, Platform, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

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
  const [twinModalVisible, setTwinModalVisible] = useState(false);
  const [stats, setStats] = useState({ clothesCount: 0, outfitsCount: 0, favoritesCount: 0, streak: 0, level: 'Style Explorer', style: 'Minimalist' });

  const BACKEND_URL = getBackendUrl();

  useEffect(() => {
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
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        const localUri = result.assets[0].uri;
        const fileUri = Platform.OS === 'android' && !localUri.startsWith('file://') ? `file://${localUri}` : localUri;

        const formData = new FormData();
        formData.append('image', {
          uri: fileUri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);

        const res = await fetch(`${BACKEND_URL}/api/upload`, {
          method: 'POST',
          body: formData,
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

  const handleGenerateDigitalTwin = async () => {
    if (user?.digitalTwinUrl) {
      setTwinModalVisible(true);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        const localUri = result.assets[0].uri;
        const fileUri = Platform.OS === 'android' && !localUri.startsWith('file://') ? `file://${localUri}` : localUri;

        const formData = new FormData();
        formData.append('image', {
          uri: fileUri,
          type: 'image/jpeg',
          name: 'twin.jpg',
        } as any);

        const res = await fetch(`${BACKEND_URL}/api/user/${user.id}/digital-twin`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        
        if (data.success) {
          const newUser = { ...user, digitalTwinUrl: data.twinUrl };
          await AsyncStorage.setItem('user', JSON.stringify(newUser));
          setUser(newUser);
          alert('Digital Twin generated successfully!');
        } else {
          alert('Failed to generate Digital Twin: ' + data.error);
        }
      } catch (e) {
        console.error('Twin generation error:', e);
        alert('Network error while generating Digital Twin.');
      } finally {
        setUploading(false);
      }
    }
  };

  const MenuItem = ({ icon, label, onPress, isSwitch, switchValue, onSwitchChange, customColor }: any) => (
    <View>
      <TouchableOpacity 
        style={styles.menuItem} 
        onPress={onPress} 
        activeOpacity={isSwitch ? 1 : 0.7}
        disabled={isSwitch}
      >
        <View style={styles.menuItemLeft}>
          <Ionicons name={icon} size={22} color={customColor || "#000"} />
          <Text style={[styles.menuItemText, customColor && { color: customColor }]}>{label}</Text>
        </View>
        
        {isSwitch ? (
          <Switch 
            value={switchValue} 
            onValueChange={onSwitchChange} 
            trackColor={{ false: '#EAEAEA', true: '#000' }} 
            thumbColor="#fff" 
          />
        ) : (
          <Ionicons name="chevron-forward" size={16} color="#CCC" />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* ── Top Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerBtnPlaceholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* ── Profile Info ── */}
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleUpdateAvatar}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{user?.name?.charAt(0) || 'U'}</Text>
              </View>
            )}
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.nameText}>{user?.name || 'User'}</Text>
          <Text style={styles.emailText}>{user?.email || '@fashion.twin'}</Text>
        </View>

        {/* ── Main White Menu Card ── */}
        
        {/* Standalone Digital Twin Banner */}
        <TouchableOpacity style={styles.standaloneTwinBanner} onPress={handleGenerateDigitalTwin} activeOpacity={0.9}>
          <LinearGradient
            colors={['#111111', '#333333']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.twinBannerContent}>
            <View style={styles.twinBannerLeft}>
              <Ionicons name="sparkles" size={24} color="#FFF" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.twinBannerTitle}>VEYRA DIGITAL TWIN</Text>
                <Text style={styles.twinBannerSub}>{user?.digitalTwinUrl ? 'View your AI Twin' : 'Create your AI Twin'}</Text>
              </View>
            </View>
            <View style={[styles.arrowCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="arrow-forward" size={14} color="#FFF" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Card 1: Features */}
        <View style={styles.menuCard}>
          <MenuItem icon="shirt-outline" label={`Wardrobe Stats (${stats.clothesCount} items)`} onPress={() => {}} />
          <MenuItem icon="images-outline" label="Inspiration Feed" onPress={() => router.push('/inspo')} />
        </View>

        {/* Card 2: Preferences */}
        <View style={styles.menuCard}>
          <MenuItem icon="notifications-outline" label="Daily Reminders" isSwitch switchValue={notifs} onSwitchChange={setNotifs} />
          <MenuItem icon="partly-sunny-outline" label="Weather Insights" isSwitch switchValue={weather} onSwitchChange={setWeather} />
        </View>

        {/* Card 3: Support & Logout */}
        <View style={styles.menuCard}>
          <MenuItem icon="help-circle-outline" label="FAQ & Support" onPress={() => {}} />
          <MenuItem 
            icon="log-out-outline" 
            label="Sign Out" 
            onPress={async () => {
              await AsyncStorage.removeItem('user');
              router.replace('/login');
            }} 
            customColor="#FF3B30"
          />
        </View>

        <Text style={styles.versionText}>VEYRA · v1.0.0</Text>
      </ScrollView>

      {/* ── Twin Modal ── */}
      <Modal visible={twinModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalBackground}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setTwinModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Your Digital Twin</Text>
              <View style={{ width: 40 }} />
            </View>
            <View style={styles.modalImageContainer}>
              {user?.digitalTwinUrl && (
                <Image source={{ uri: user.digitalTwinUrl }} style={styles.fullTwinImage} resizeMode="contain" />
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F5F5' // Off-white premium background
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  
  scroll: { 
    paddingBottom: 40,
  },

  // Profile Section
  profileSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFF',
    padding: 4, // creates the white border effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    resizeMode: 'cover',
  },
  // Avatar
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  emailText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  
  // Menu Card
  menuCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 24,
    paddingVertical: 8,
    marginBottom: 16, // Space between segmented cards
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
  },

  // Standalone Twin Banner
  standaloneTwinBanner: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  twinBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  twinBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  twinBannerTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    marginBottom: 4,
  },
  twinBannerSub: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },

  // Menu Item
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 14,
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 20,
  },

  versionText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 12,
    color: '#CCC',
    fontWeight: '600',
    letterSpacing: 2,
  },

  // Modal
  modalBackground: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalImageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullTwinImage: {
    width: '100%',
    height: '100%',
  },
});
