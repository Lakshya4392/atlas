import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Platform, Animated, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';

const getBackendUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
};

export default function AddItemScreen() {
  const [step, setStep] = useState<'IDLE' | 'ANALYZING' | 'DONE'>('IDLE');
  const [extractedItems, setExtractedItems] = useState<{url: string, tags: any, pHash?: string, transparentImageUrl?: string, isDuplicate?: boolean}[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const BACKEND_URL = getBackendUrl();

  useEffect(() => {
    if (step === 'IDLE') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
    }
  }, [step]);

  const handlePickImage = async (useCamera = false) => {
    let result;
    if (useCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera access is required.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 5], quality: 0.8 });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 5], quality: 0.8 });
    }

    if (!result.canceled) {
      startAiAnalysis(result.assets[0].uri);
    }
  };

  const startAiAnalysis = async (localUri: string) => {
    setStep('ANALYZING');
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const currentUserId = storedUser ? JSON.parse(storedUser).id : 'anonymous';

      const targetUrl = `${BACKEND_URL}/api/clothes/extract`;
      console.log(`🎯 EXTRACTION REQUEST → ${targetUrl}`);
      console.log(`   User: ${currentUserId}`);

      const fileUri = Platform.OS === 'android' && !localUri.startsWith('file://') ? `file://${localUri}` : localUri;

      const formData = new FormData();
      formData.append('image', {
        uri: fileUri,
        name: 'messy_photo.jpg',
        type: 'image/jpeg',
      } as any);
      formData.append('userId', currentUserId);

      // 90 second timeout for complex generations
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const res = await fetch(targetUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      console.log(`📥 Response status: ${res.status}`);
      const data = await res.json();

      // Handle rate limiting
      if (res.status === 429) {
        Alert.alert('⏳ Rate Limited', data.error || 'Please wait before trying again.');
        setStep('IDLE');
        return;
      }

      if (!data.success) throw new Error(data.error);

      const items = data.items || [];
      const hasDuplicate = items.some((i: any) => i.isDuplicate);
      if (hasDuplicate) {
        Alert.alert(
          '⚡ Instant Match',
          'We found this exact item in your closet already! We pulled it from your cache instantly to save time.'
        );
      }

      setExtractedItems(items);
      setCurrentIndex(0);
      setStep('DONE');
    } catch (error: any) {
      const msg = error.name === 'AbortError' 
        ? 'Request timed out (60s). Check backend terminal for errors.'
        : error.message;
      console.log(`❌ Extraction Error: ${msg}`);
      Alert.alert('AI Error', 'Extraction failed: ' + msg);
      setStep('IDLE');
    }
  };

  const handleSave = async () => {
    if (extractedItems.length === 0) return;
    setLoading(true);

    try {
      const storedUser = await AsyncStorage.getItem('user');
      const userId = storedUser ? JSON.parse(storedUser).id : null;
      if (!userId) throw new Error('Not logged in');

      let savedCount = 0;
      let duplicateCount = 0;

      for (const item of extractedItems) {
        if (item.isDuplicate) {
          duplicateCount++;
          continue; // Skip saving, it's already in the DB
        }

        const saveRes = await fetch(`${BACKEND_URL}/api/clothes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            name: item.tags.name,
            category: item.tags.category,
            color: item.tags.color,
            brand: item.tags.brand,
            imageUrl: item.url, // Legacy display
            transparentImageUrl: item.transparentImageUrl || item.url, // System 1 Storage
            pHash: item.pHash, // System 2 Detection
            tags: ['ai-extracted'],
          }),
        });
        const saveData = await saveRes.json();
        if (!saveData.success) {
          // If backend caught a duplicate we missed
          if (saveRes.status === 409) duplicateCount++;
          else throw new Error(saveData.error);
        } else {
          savedCount++;
        }
      }

      const msg = savedCount > 0 
        ? `Saved ${savedCount} new item(s) to your closet!`
        : `All items were already in your closet.`;

      Alert.alert('Done ✓', msg, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.7} disabled={loading || step === 'ANALYZING'}>
          <Ionicons name="close" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI SCANNER</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {step === 'IDLE' && (
          <View style={styles.idleState}>
            <Text style={styles.idleTitle}>Digitize Your Wardrobe</Text>
            <Text style={styles.idleSub}>Our AI will automatically remove the background and extract the brand, category, and color.</Text>
            
            <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]}>
              <TouchableOpacity style={styles.mainBtn} onPress={() => handlePickImage(true)} activeOpacity={0.9}>
                <Ionicons name="camera" size={40} color="#FFF" />
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity style={styles.galleryBtn} onPress={() => handlePickImage(false)}>
              <Ionicons name="image-outline" size={20} color="#000" />
              <Text style={styles.galleryText}>Upload from Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'ANALYZING' && (
          <View style={styles.analyzingState}>
            <View style={styles.imageWrapper}>
              <View style={[styles.previewImage, { backgroundColor: '#E0E0E0' }]} />
              <View style={styles.scannerOverlay}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={styles.scanningText}>Extracting outfits...</Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 4 }}>Analyzing multiple items</Text>
              </View>
            </View>
          </View>
        )}

        {step === 'DONE' && extractedItems.length > 0 && (
          <View style={styles.doneState}>
            {extractedItems.length > 1 && (
              <Text style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 10, color: Colors.primary }}>
                {extractedItems.length} ITEMS DETECTED (Swipe to view)
              </Text>
            )}
            
            <Animated.ScrollView 
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
                setCurrentIndex(newIndex);
              }}
              style={{ flexGrow: 0 }}
            >
              {extractedItems.map((item, idx) => (
                <View key={idx} style={{ width: 340, alignItems: 'center' }}>
                  <View style={styles.imageWrapper}>
                    <Image source={{ uri: item.url }} style={styles.previewImage} />
                    <View style={styles.aiBadge}>
                      <Ionicons name="sparkles" size={14} color="#FFF" />
                      <Text style={styles.aiBadgeText}>{item.isDuplicate ? 'CACHED' : 'AI EXTRACTED'}</Text>
                    </View>
                  </View>

                  <View style={styles.extractedInfo}>
                    <Text style={styles.successTitle}>{item.tags.name}</Text>
                    <View style={styles.tagsGrid}>
                      <View style={styles.tag}>
                        <Text style={styles.tagLabel}>CATEGORY</Text>
                        <Text style={styles.tagValue}>{item.tags.category.toUpperCase()}</Text>
                      </View>
                      <View style={styles.tag}>
                        <Text style={styles.tagLabel}>COLOR</Text>
                        <Text style={styles.tagValue}>{item.tags.color.toUpperCase()}</Text>
                      </View>
                      <View style={styles.tag}>
                        <Text style={styles.tagLabel}>BRAND</Text>
                        <Text style={styles.tagValue}>{item.tags.brand.toUpperCase()}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </Animated.ScrollView>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 10 }}>
              {extractedItems.map((_, idx) => (
                <View key={idx} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: idx === currentIndex ? Colors.primary : '#ccc', marginHorizontal: 4 }} />
              ))}
            </View>

            <TouchableOpacity style={styles.saveMainBtn} onPress={handleSave} activeOpacity={0.85} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.saveMainBtnText}>SAVE {extractedItems.length > 1 ? 'ALL ITEMS' : 'TO CLOSET'}</Text>
                </>
              )}
            </TouchableOpacity>
            
            {!loading && (
               <TouchableOpacity style={styles.retakeBtn} onPress={() => setStep('IDLE')}>
                 <Text style={styles.retakeText}>RETAKE PHOTO</Text>
               </TouchableOpacity>
            )}
          </View>
        )}
      </View>
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
    paddingVertical: 16,
  },
  cancelBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  
  // IDLE STATE
  idleState: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  idleTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  idleSub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
    marginBottom: 60,
  },
  pulseCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  mainBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
  },
  galleryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },

  // ANALYZING STATE
  analyzingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 3/4,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F9F9F9',
    position: 'relative',
    ...Shadows.md,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  scanningText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // DONE STATE
  doneState: {
    flex: 1,
    paddingBottom: 40,
  },
  aiBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  aiBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  extractedInfo: {
    marginTop: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
    marginBottom: 20,
  },
  tagsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  tag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 120,
  },
  tagLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  tagValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '900',
  },

  saveMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#000',
    paddingVertical: 18,
    borderRadius: 30,
    ...Shadows.lg,
  },
  saveMainBtnText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 2,
  },
  retakeBtn: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 10,
  },
  retakeText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
