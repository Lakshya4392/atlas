import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { CATEGORIES } from '../constants/data';

const EMOJIS = ['👕', '👖', '🧥', '👗', '👔', '🧶', '👟', '🥾', '👠', '👜', '⌚', '🕶️', '🧣', '🎩', '👒'];
const COLORS = [
  { name: 'Black', hex: '#1A1A1A' },
  { name: 'White', hex: '#F5F4F0' },
  { name: 'Navy', hex: '#1E3A5F' },
  { name: 'Indigo', hex: '#312E81' },
  { name: 'Camel', hex: '#D4A574' },
  { name: 'Olive', hex: '#65A30D' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Sky Blue', hex: '#7DD3FC' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Tan', hex: '#9B8B6E' },
  { name: 'Brown', hex: '#92400E' },
];

export default function AddItemScreen() {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [cat, setCat] = useState('tops');
  const [emoji, setEmoji] = useState('👕');
  const [color, setColor] = useState(COLORS[0]);
  const [tags, setTags] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Dynamically resolve the backend URL
  const getBackendUrl = () => {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:3000`;
    }
    return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
  };

  const BACKEND_URL = getBackendUrl();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Camera access is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Info', 'Please enter an item name.');
      return;
    }

    if (!image) {
      Alert.alert('Missing Photo', 'Please add a photo of your item.');
      return;
    }

    setLoading(true);

    try {
      // 1. Upload to Cloudinary via our backend
      const formData = new FormData();
      formData.append('image', {
        uri: image,
        name: 'upload.jpg',
        type: 'image/jpeg',
      } as any);

      const uploadRes = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error(uploadData.error);

      const imageUrl = uploadData.url;

      // 2. Save to database
      const storedUser = await AsyncStorage.getItem('user');
      const userId = storedUser ? JSON.parse(storedUser).id : null;
      if (!userId) throw new Error('Not logged in');

      const saveRes = await fetch(`${BACKEND_URL}/api/clothes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name,
          category: cat,
          color: color.name,
          brand,
          imageUrl,
          tags: tags.split(',').map(t => t.trim()).filter(t => t),
        }),
      });

      const saveData = await saveRes.json();
      if (!saveData.success) throw new Error(saveData.error);

      Alert.alert(
        'Added ✓',
        `${name} added to your cloud closet.`,
        [{ text: 'Done', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', error.message || 'Something went wrong while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ADD NEW ITEM</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={save} activeOpacity={0.7} disabled={loading}>
          <Text style={styles.saveBtnText}>SAVE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── Photo upload area ── */}
        <TouchableOpacity style={styles.photoArea} activeOpacity={0.7} onPress={pickImage}>
          <LinearGradient
            colors={['#F9F8F6', '#F0EDE6']}
            style={styles.photoGradient}
          />
          {image ? (
            <Image source={{ uri: image }} style={styles.fullImage} />
          ) : (
            <>
              <Text style={styles.photoEmoji}>{emoji}</Text>
              <Text style={styles.photoLabel}>TAP TO ADD PHOTO</Text>
            </>
          )}
          <View style={styles.cameraRow}>
            <TouchableOpacity onPress={takePhoto} style={styles.cameraBtn}>
              <Ionicons name="camera-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.cameraText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* ── Icon picker ── */}
        <View style={styles.section}>
          <Text style={styles.label}>CHOOSE ICON</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiScroll}>
            {EMOJIS.map(e => (
              <TouchableOpacity
                key={e}
                style={[styles.emojiBtn, emoji === e && styles.emojiBtnActive]}
                onPress={() => setEmoji(e)}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Item name ── */}
        <View style={styles.section}>
          <Text style={styles.label}>ITEM NAME <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Classic White Tee"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>

        {/* ── Brand ── */}
        <View style={styles.section}>
          <Text style={styles.label}>BRAND (OPTIONAL)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Uniqlo, Zara, Nike"
            placeholderTextColor={Colors.textMuted}
            value={brand}
            onChangeText={setBrand}
          />
        </View>

        {/* ── Category ── */}
        <View style={styles.section}>
          <Text style={styles.label}>CATEGORY</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.filter(c => c.id !== 'all').map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.catBtn, cat === c.id && styles.catBtnActive]}
                onPress={() => setCat(c.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={c.icon as any}
                  size={15}
                  color={cat === c.id ? '#fff' : Colors.textSecondary}
                />
                <Text style={[styles.catText, cat === c.id && styles.catTextActive]}>
                  {c.name.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Color ── */}
        <View style={styles.section}>
          <Text style={styles.label}>COLOR</Text>
          <View style={styles.colorGrid}>
            {COLORS.map(c => (
              <TouchableOpacity
                key={c.name}
                style={[
                  styles.colorBtn,
                  { backgroundColor: c.hex },
                  color.name === c.name && styles.colorBtnActive,
                ]}
                onPress={() => setColor(c)}
                activeOpacity={0.7}
              >
                {color.name === c.name && (
                  <Ionicons
                    name="checkmark"
                    size={12}
                    color={c.hex === '#F5F4F0' ? '#000' : '#fff'}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Tags ── */}
        <View style={styles.section}>
          <Text style={styles.label}>TAGS</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="casual, summer, basic, minimal"
            placeholderTextColor={Colors.textMuted}
            value={tags}
            onChangeText={setTags}
            multiline
            numberOfLines={2}
          />
        </View>

        <TouchableOpacity style={styles.saveMainBtn} onPress={save} activeOpacity={0.85} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveMainBtnText}>ADD TO CLOSET</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  saveBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  saveBtnText: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: FontWeight.black,
    letterSpacing: 1,
  },

  scroll: { padding: Spacing['2xl'], gap: Spacing['2xl'], paddingBottom: 40 },

  photoArea: {
    height: 220,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  photoGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  photoEmoji: {
    fontSize: 88,
  },
  photoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    letterSpacing: 2,
  },
  cameraRow: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    ...Shadows.sm,
  },
  cameraText: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  fullImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  section: { gap: Spacing.md },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.black,
    letterSpacing: 1.5,
  },
  required: {
    color: Colors.error,
  },

  emojiScroll: { gap: Spacing.sm },
  emojiBtn: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emojiBtnActive: {
    borderColor: Colors.accent,
    borderWidth: 2,
  },
  emojiText: { fontSize: 26 },

  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  catTextActive: { color: '#fff' },

  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  colorBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  colorBtnActive: {
    borderColor: Colors.accent,
    borderWidth: 3,
  },

  saveMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    ...Shadows.md,
  },
  saveMainBtnText: {
    fontSize: FontSize.md,
    color: '#fff',
    fontWeight: FontWeight.black,
    letterSpacing: 2,
  },
});
