import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator, Image, Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USER_PROFILE } from '../../constants/data';
import { Colors, Shadows } from '../../constants/theme';
import { generateOutfitSuggestion } from '../../services/ai';
import { fetchWeather } from '../../services/weather';

const { width, height } = Dimensions.get('window');

// Standardized Design System via Colors & Shadows
const getBackendUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
};

export default function AIStylistScreen() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [wardrobe, setWardrobe] = useState<any[]>([]);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Dynamically resolve the backend URL
  const BACKEND_URL = getBackendUrl();
  const [userId, setUserId] = useState<string | null>(null);

  React.useEffect(() => {
    const initialize = async () => {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setUserId(u.id);
        setUser(u);
        setUserAvatar(u.avatar);
      }
    };
    initialize();
  }, []);

  React.useEffect(() => {
    if (!userId) return;
    const fetchWardrobe = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/clothes/${userId}`);
        const data = await res.json();
        if (data.success) {
          setWardrobe(data.items);
        }
      } catch (error) {
        console.error('Fetch wardrobe error:', error);
      }
    };
    fetchWardrobe();
  }, [userId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { type: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Use city name for weather instead of coordinates to avoid "wrong latitude" errors
      const weatherData = await fetchWeather(); 
      const aiRaw = await generateOutfitSuggestion(input, wardrobe, weatherData, USER_PROFILE);
      
      let parsed;
      try {
        parsed = JSON.parse(aiRaw);
        const fullOutfit = parsed.outfit.map((o: any) => ({
          ...o,
          item: wardrobe.find(w => w.id === o.id)
        })).filter((o: any) => o.item);
        
        setMessages(prev => [...prev, { type: 'ai', ...parsed, outfit: fullOutfit }]);
      } catch (err) {
        setMessages(prev => [...prev, { type: 'ai', stylingAdvice: aiRaw }]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleTryOn = async (item: any) => {
    let currentAvatar = userAvatar;

    // Step 1: If no avatar, ask user to upload one first
    if (!currentAvatar) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      // Show loading while uploading avatar
      setTryOnLoading(true);
      try {
        const formData = new FormData();
        formData.append('image', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);

        const uploadRes = await fetch(`${BACKEND_URL}/api/upload`, {
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const uploadData = await uploadRes.json();

        if (!uploadData.success) {
          alert('Photo upload failed. Please try again.');
          setTryOnLoading(false);
          return;
        }

        // Save avatar to DB + local state
        await fetch(`${BACKEND_URL}/api/user/${userId}/avatar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: uploadData.url }),
        });

        currentAvatar = uploadData.url;
        setUserAvatar(currentAvatar);
        const updatedUser = { ...user, avatar: currentAvatar };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

      } catch (e) {
        console.error('Avatar upload error:', e);
        alert('Upload failed. Check your connection.');
        setTryOnLoading(false);
        return;
      }
    } else {
      // Avatar already exists, just show loading
      setTryOnLoading(true);
    }

    // Step 2: Call fal.ai try-on with avatar + garment
    try {
      if (!item.imageUrl) {
        alert('This item has no image. Add a photo to the item first.');
        setTryOnLoading(false);
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/try-on`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garm_img: item.imageUrl,
          human_img: currentAvatar,
          description: `${item.color} ${item.name}`,
        }),
      });

      const data = await res.json();

      if (data.success && data.url) {
        setTryOnResult(data.url);
      } else {
        alert(data.error || 'Try-on failed. Please try again.');
      }
    } catch (e) {
      console.error('Try-on network error:', e);
      alert('Network error. Make sure the server is running.');
    } finally {
      setTryOnLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, '#F8F9FA', Colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* ── Top Header Controls ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.circleBtn} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.newChatBtn} onPress={startNewChat} activeOpacity={0.7}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.newChatText}>NEW CHAT</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleBtn} activeOpacity={0.7}>
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── Chat Messages ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.welcomeContainer}>
            <View style={styles.aiAvatarSmall}>
              <Ionicons name="sparkles" size={16} color="#fff" />
            </View>
            <Text style={styles.welcomeTitle}>ATLA AI STYLIST</Text>
            <Text style={styles.welcomeSub}>Personalized styling from your closet</Text>
          </View>

          {messages.length === 0 && (
            <View style={styles.suggestionsContainer}>
              {[
                "What should I wear for a rainy day in NYC?",
                "I have a dinner date tonight, style me.",
                "Minimalist look for a brunch meet."
              ].map((s, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionChip}
                  onPress={() => setInput(s)}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {messages.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.messageRow,
                msg.type === 'user' ? styles.userRow : styles.aiRow
              ]}
            >
              {msg.type === 'ai' && (
                <View style={styles.aiAvatarBubble}>
                  <Ionicons name="sparkles" size={12} color="#000" />
                </View>
              )}
              <View style={styles.messageBubbleContainer}>
                {msg.type === 'user' ? (
                  <View style={styles.userBubble}>
                    <Text style={styles.userText}>{msg.text}</Text>
                  </View>
                ) : (
                  <View style={styles.aiContent}>
                    {/* Visual Outfit Cards */}
                    {msg.outfit && msg.outfit.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.outfitScroll}>
                        {msg.outfit.map((o: any, idx: number) => (
                          <View key={idx} style={styles.outfitCard}>
                            <View style={styles.cardImageWrapper}>
                              {o.item.imageUrl ? (
                                <Image source={{ uri: o.item.imageUrl }} style={styles.cardImage} />
                              ) : (
                                <View style={styles.placeholderImage}>
                                  <Ionicons name="shirt-outline" size={32} color={Colors.textTertiary} />
                                </View>
                              )}
                            </View>
                            <Text style={styles.cardItemName}>{o.item.name.toUpperCase()}</Text>
                            <TouchableOpacity 
                              style={styles.tryOnBtn} 
                              onPress={() => handleTryOn(o.item)}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="sparkles" size={10} color="#fff" />
                              <Text style={styles.tryOnText}>TRY ON ME</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                    )}

                    <View style={styles.aiTextContent}>
                      {msg.weatherContext && (
                        <View style={styles.weatherBadge}>
                          <Text style={styles.weatherBadgeText}>{msg.weatherContext.toUpperCase()}</Text>
                        </View>
                      )}
                      <Text style={styles.aiText}>{msg.stylingAdvice}</Text>
                      {msg.idealAddition && (
                        <View style={styles.additionContainer}>
                          <Ionicons name="add-circle-outline" size={14} color={Colors.textMuted} />
                          <Text style={styles.additionText}>IDEAL ADDITION: {msg.idealAddition.toUpperCase()}</Text>
                        </View>
                      )}
                      {/* Save outfit button */}
                      {msg.outfit && msg.outfit.length > 0 && (
                        <TouchableOpacity
                          style={styles.saveOutfitBtn}
                          onPress={async () => {
                            if (!userId) return;
                            try {
                              const res = await fetch(`${BACKEND_URL}/api/outfits`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  userId,
                                  name: 'AI Look — ' + new Date().toLocaleDateString(),
                                  occasion: 'Casual',
                                  itemIds: msg.outfit.map((o: any) => o.id).filter(Boolean),
                                  aiGenerated: true,
                                  weather: msg.weatherContext || '',
                                }),
                              });
                              const data = await res.json();
                              if (data.success) alert('Outfit saved to your collection!');
                            } catch (e) {
                              console.error('Save outfit error:', e);
                            }
                          }}
                        >
                          <Ionicons name="bookmark-outline" size={12} color="#fff" />
                          <Text style={styles.saveOutfitText}>SAVE OUTFIT</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </View>
          ))}

          {loading && (
            <View style={styles.aiRow}>
              <View style={styles.aiAvatarBubble}>
                <Ionicons name="sparkles" size={12} color="#000" />
              </View>
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color={Colors.textPrimary} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Input Area ── */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TouchableOpacity style={styles.inputActionBtn}>
                <Ionicons name="mic-outline" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Ask your stylist..."
                placeholderTextColor={Colors.textLight}
                value={input}
                onChangeText={setInput}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!input.trim() || loading}
              >
                <Ionicons
                  name="arrow-up"
                  size={20}
                  color={input.trim() ? '#fff' : Colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── Virtual Try-On Result Modal ── */}
      <Modal visible={!!tryOnResult || tryOnLoading} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {tryOnLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={styles.modalLoadingTitle}>VIRTUAL TRY-ON</Text>
                <Text style={styles.modalLoadingText}>AI is fitting the garment to your body...</Text>
                <Text style={styles.modalLoadingHint}>This takes 15–30 seconds</Text>
              </View>
            ) : tryOnResult ? (
              <>
                <Image source={{ uri: tryOnResult }} style={styles.resultImage} resizeMode="cover" />
                <TouchableOpacity style={styles.closeModalBtn} onPress={() => setTryOnResult(null)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.modalFooter}>
                  <Text style={styles.modalFooterTitle}>VIRTUAL LOOK</Text>
                  <Text style={styles.modalFooterSub}>AI-generated try-on result.</Text>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  newChatText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  aiAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 4,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  suggestionsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  suggestionChip: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  suggestionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 24,
    width: '100%',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
    gap: 12,
  },
  aiAvatarBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  messageBubbleContainer: {
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderBottomRightRadius: 4,
  },
  userText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  aiContent: {
    gap: 12,
  },
  outfitScroll: {
    paddingBottom: 8,
  },
  outfitCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 12,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    ...Shadows.small,
  },
  cardImageWrapper: {
    width: '100%',
    height: 160,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardItemName: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  tryOnBtn: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    marginHorizontal: 8,
  },
  tryOnText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  aiTextContent: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  weatherBadge: {
    backgroundColor: '#F0F0F0',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  weatherBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  aiText: {
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  additionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  additionText: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '800',
    letterSpacing: 1,
  },
  saveOutfitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#000',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  saveOutfitText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  loadingBubble: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 12,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    height: height * 0.7,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 20,
  },
  modalLoadingTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 3,
    color: '#000',
  },
  modalLoadingText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  modalLoadingHint: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  resultImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'cover',
  },
  closeModalBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  modalFooter: {
    padding: 20,
    alignItems: 'center',
  },
  modalFooterTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#000',
    marginBottom: 4,
  },
  modalFooterSub: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 30,
    paddingTop: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.medium,
  },
  inputActionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    maxHeight: 100,
    paddingHorizontal: 8,
    fontWeight: '500',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: 'transparent',
  },
});
