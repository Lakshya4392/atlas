import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Dimensions, Image, ActivityIndicator, Platform, Modal, Alert
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
  const [twinGuidelinesVisible, setTwinGuidelinesVisible] = useState(false);
  const [premiumError, setPremiumError] = useState({visible: false, message: ''});
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

  const handleGenerateDigitalTwin = async (forceUpdate = false) => {
    if (!forceUpdate && user?.digitalTwinUrl) {
      setTwinModalVisible(true);
      return;
    }

    setTwinModalVisible(false);
    setTwinGuidelinesVisible(true);
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    setTwinGuidelinesVisible(false);
    let result;
    
    if (source === 'camera') {
       const { status } = await ImagePicker.requestCameraPermissionsAsync();
       if (status !== 'granted') {
          setPremiumError({ visible: true, message: 'We need camera permissions to make this work!' });
          return;
       }
       result = await ImagePicker.launchCameraAsync({
         mediaTypes: ImagePicker.MediaTypeOptions.Images,
         allowsEditing: true,
         quality: 0.8,
         base64: true,
       });
    } else {
       result = await ImagePicker.launchImageLibraryAsync({
         mediaTypes: ImagePicker.MediaTypeOptions.Images,
         allowsEditing: true,
         quality: 0.8,
         base64: true,
       });
    }

    if (!result.canceled && result.assets[0].base64) {
      setUploading(true);
      try {
        const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;

        const res = await fetch(`${BACKEND_URL}/api/user/${user.id}/digital-twin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Uri }),
        });
        const data = await res.json();
        
        if (data.success) {
          const newUser = { ...user, digitalTwinUrl: data.twinUrl };
          await AsyncStorage.setItem('user', JSON.stringify(newUser));
          setUser(newUser);
          // alert('Digital Twin generated successfully!');
          setTwinModalVisible(true);
        } else {
          if (data.error && data.error.includes("VALIDATION_ERROR:")) {
            const cleanError = data.error.replace("VALIDATION_ERROR:", "").trim();
            setPremiumError({ visible: true, message: cleanError });
          } else {
            setPremiumError({ visible: true, message: data.error || 'Failed to process image' });
          }
        }
      } catch (e) {
        console.error('Twin generation error:', e);
        setPremiumError({ visible: true, message: 'Network error while generating Digital Twin.' });
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
        <TouchableOpacity style={styles.standaloneTwinBanner} onPress={() => handleGenerateDigitalTwin()} activeOpacity={0.9}>
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
                <Text style={styles.twinBannerSub}>{user?.digitalTwinUrl ? 'View & Manage AI Twin' : 'Create your AI Twin'}</Text>
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

      {/* ── Twin Viewer Modal (Premium) ── */}
      <Modal visible={twinModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalBackground}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setTwinModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Your AI Avatar</Text>
              <View style={{width: 32}} />
            </View>
            <View style={styles.modalImageContainer}>
              {user?.digitalTwinUrl && (
                <Image source={{ uri: user.digitalTwinUrl }} style={styles.fullTwinImage} resizeMode="contain" />
              )}
            </View>
            <View style={{paddingHorizontal: 20, paddingBottom: 30, paddingTop: 16, backgroundColor: '#FFF'}}>
              <TouchableOpacity
                style={[styles.premiumPrimaryBtn, { flex: 0, marginRight: 0, width: '100%' }]}
                onPress={() => { setTwinModalVisible(false); setTwinGuidelinesVisible(true); }}
              >
                <Ionicons name="refresh" size={18} color="#FFF" style={{marginRight: 8}} />
                <Text style={styles.premiumBtnTextWhite}>Update Avatar</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ── Uploading/Loading Overlay ── */}
      <Modal visible={uploading} transparent={true} animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Generating your Digital Twin...</Text>
            <Text style={styles.loadingSubtext}>This may take 15-30 seconds</Text>
          </View>
        </View>
      </Modal>

      {/* ── Guidelines Onboarding Modal ── */}
      <Modal visible={twinGuidelinesVisible} transparent={true} animationType="slide">
        <View style={styles.guidelinesOverlay}>
          <View style={styles.guidelinesCard}>
             <TouchableOpacity style={styles.guidelinesClose} onPress={() => setTwinGuidelinesVisible(false)}>
                <Ionicons name="close" size={24} color="#888" />
             </TouchableOpacity>
             
             <View style={styles.guidelinesIconHeader}>
                <Ionicons name="body-outline" size={42} color="#1A1A1A" />
             </View>
             
             <Text style={styles.guidelinesTitle}>Create Your Avatar</Text>
             <Text style={styles.guidelinesSub}>For the most accurate Virtual Try-On, please follow these rules:</Text>

             <View style={styles.rulesList}>
                <View style={styles.ruleItem}>
                   <Ionicons name="checkmark-circle" size={20} color="#1A1A1A" />
                   <Text style={styles.ruleText}>Stand perfectly straight</Text>
                </View>
                <View style={styles.ruleItem}>
                   <Ionicons name="checkmark-circle" size={20} color="#1A1A1A" />
                   <Text style={styles.ruleText}>Ensure your Full Body is visible</Text>
                </View>
                <View style={styles.ruleItem}>
                   <Ionicons name="checkmark-circle" size={20} color="#1A1A1A" />
                   <Text style={styles.ruleText}>Good lighting & plain background</Text>
                </View>
             </View>

             <View style={styles.guidelinesActions}>
                <TouchableOpacity style={styles.premiumPrimaryBtn} onPress={() => pickImage('gallery')}>
                   <Ionicons name="images" size={20} color="#FFF" style={{marginRight: 8}} />
                   <Text style={styles.premiumBtnTextWhite}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.premiumSecondaryBtn} onPress={() => pickImage('camera')}>
                   <Ionicons name="camera" size={20} color="#1A1A1A" style={{marginRight: 8}} />
                   <Text style={styles.premiumBtnTextDark}>Camera</Text>
                </TouchableOpacity>
             </View>
          </View>
        </View>
      </Modal>

      {/* ── Premium Error Toast ── */}
      {premiumError.visible && (
         <View style={styles.premiumErrorOverlay}>
            <View style={styles.premiumErrorCard}>
               <Ionicons name="alert-circle" size={32} color="#E74C3C" />
               <Text style={styles.premiumErrorTitle}>Oops! Something went wrong.</Text>
               <Text style={styles.premiumErrorMsg}>{premiumError.message}</Text>
               <TouchableOpacity 
                 style={styles.premiumErrorBtn} 
                 onPress={() => setPremiumError({visible: false, message: ''})}
               >
                  <Text style={styles.premiumErrorBtnText}>Got it</Text>
               </TouchableOpacity>
            </View>
         </View>
      )}

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

  // Twin Modal
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
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  closeBtn: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  modalImageContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullTwinImage: {
    width: '100%',
    height: '100%',
  },

  // Loading Overlay
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    backgroundColor: '#FFF',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },

  // Guidelines Modal
  guidelinesOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  guidelinesCard: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 30, paddingBottom: 50, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 20 },
  guidelinesClose: { position: 'absolute', top: 20, right: 20, padding: 8 },
  guidelinesIconHeader: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  guidelinesTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  guidelinesSub: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 10 },
  rulesList: { width: '100%', backgroundColor: '#F9F9F9', borderRadius: 20, padding: 20, marginBottom: 30 },
  ruleItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ruleText: { fontSize: 15, color: '#1A1A1A', fontWeight: '500', marginLeft: 12 },
  guidelinesActions: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  premiumPrimaryBtn: { flex: 1, backgroundColor: '#1A1A1A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, marginRight: 10 },
  premiumSecondaryBtn: { flex: 1, backgroundColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, marginLeft: 10 },
  premiumBtnTextWhite: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  premiumBtnTextDark: { color: '#1A1A1A', fontSize: 16, fontWeight: '700' },

  // Premium Error Overlay
  premiumErrorOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  premiumErrorCard: { backgroundColor: '#FFF', width: '85%', borderRadius: 24, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 20 },
  premiumErrorTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginTop: 16, marginBottom: 8 },
  premiumErrorMsg: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  premiumErrorBtn: { backgroundColor: '#1A1A1A', width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  premiumErrorBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' }
});