import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator, Image, Modal, FlatList, Animated
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

// Chat session type
interface ChatSession {
  id: string;
  title: string;
  messages: any[];
  createdAt: string;
}

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
  const [userId, setUserId] = useState<string | null>(null);

  // Chat history state
  const [showHistory, setShowHistory] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const BACKEND_URL = getBackendUrl();

  // ── Load user + wardrobe + chat history ──
  useEffect(() => {
    const initialize = async () => {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setUserId(u.id);
        setUser(u);
        setUserAvatar(u.avatar);
      }
      // Load chat history
      const history = await AsyncStorage.getItem('chat_sessions');
      if (history) setChatSessions(JSON.parse(history));
    };
    initialize();
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetch(`${BACKEND_URL}/api/clothes/${userId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setWardrobe(d.items); })
      .catch(e => console.error('Fetch wardrobe error:', e));
  }, [userId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollToEnd({ animated: true });
  }, [messages, loading]);

  // ── Save current session to history ──
  const saveSession = useCallback(async (msgs: any[], sessionId: string, firstUserMsg?: string) => {
    if (msgs.length === 0) return;
    const title = firstUserMsg
      ? firstUserMsg.substring(0, 40) + (firstUserMsg.length > 40 ? '...' : '')
      : 'Style Chat';

    const session: ChatSession = {
      id: sessionId,
      title,
      messages: msgs,
      createdAt: new Date().toISOString(),
    };

    const existing = await AsyncStorage.getItem('chat_sessions');
    const sessions: ChatSession[] = existing ? JSON.parse(existing) : [];
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx >= 0) sessions[idx] = session;
    else sessions.unshift(session);

    // Keep only last 20 sessions
    const trimmed = sessions.slice(0, 20);
    await AsyncStorage.setItem('chat_sessions', JSON.stringify(trimmed));
    setChatSessions(trimmed);
  }, []);

  // ── Send message ──
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { type: 'user', text: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Create session ID if new chat
    const sessionId = currentSessionId || `session_${Date.now()}`;
    if (!currentSessionId) setCurrentSessionId(sessionId);

    try {
      const weatherData = await fetchWeather();
      const aiRaw = await generateOutfitSuggestion(input, wardrobe, weatherData, user || USER_PROFILE);

      let aiMsg: any;
      try {
        const parsed = JSON.parse(aiRaw);
        if (parsed.outfits && parsed.outfits.length > 0) {
          console.log(`🎯 AI generated ${parsed.outfits.length} outfits, searching products...`);
          
          // For each outfit, call the batch search endpoint
          const fullOutfits = await Promise.all(parsed.outfits.map(async (outfitData: any) => {
            try {
              const searchRes = await fetch(`${BACKEND_URL}/api/outfit/search-items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, queries: outfitData.items }),
              });
              const searchData = await searchRes.json();
              
              if (searchData.success && searchData.items) {
                return {
                  ...outfitData,
                  items: searchData.items.map((item: any) => ({
                    ...item,
                    item: {
                      id: item.closetItemId || `product_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                      name: item.name || item.title,
                      imageUrl: item.imageUrl,
                      brand: item.brand,
                      price: item.price,
                      link: item.link,
                      source: item.source,
                    }
                  })),
                };
              }
            } catch (e) {
              console.error('Outfit search pipeline error:', e);
            }
            // Fallback: return outfit with no images
            return {
              ...outfitData,
              items: outfitData.items.map((i: any) => ({
                ...i,
                item: { id: 'fallback', name: i.name, imageUrl: null }
              })),
            };
          }));
          
          aiMsg = { type: 'ai', ...parsed, outfits: fullOutfits };
        } else {
          aiMsg = { type: 'ai', ...parsed };
        }
      } catch {
        aiMsg = { type: 'ai', stylingAdvice: aiRaw };
      }

      const updatedMessages = [...newMessages, aiMsg];
      setMessages(updatedMessages);
      await saveSession(updatedMessages, sessionId, input);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // ── Load a past session ──
  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setShowHistory(false);
  };

  // ── Delete a session ──
  const deleteSession = async (sessionId: string) => {
    const updated = chatSessions.filter(s => s.id !== sessionId);
    setChatSessions(updated);
    await AsyncStorage.setItem('chat_sessions', JSON.stringify(updated));
  };

  // ── Start new chat ──
  const startNewChat = () => {
    setMessages([]);
    setInput('');
    setCurrentSessionId(null);
    setShowHistory(false);
  };

  const handlePickImage = () => {
    alert('Visual search coming soon!');
  };

  // ── Handle Try-On ──
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

  const renderMasonryItem = (outfitItem: any, isTall: boolean) => {
    const style = isTall ? styles.masonryTall : styles.masonryShort;
    if (!outfitItem || !outfitItem.item) return <View style={style} />;
    const uri = outfitItem.item.imageUrl;
    const isFromCloset = outfitItem.item.source === 'from_closet';
    
    if (uri) {
      return (
        <View style={[style, { overflow: 'hidden' }]}>
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          {isFromCloset && (
            <View style={styles.closetBadge}>
              <Ionicons name="checkmark-circle" size={10} color="#fff" />
              <Text style={styles.closetBadgeText}>YOUR CLOSET</Text>
            </View>
          )}
        </View>
      );
    }
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5', padding: 8 }]}>
        <Ionicons name="shirt-outline" size={24} color="#CCC" />
        <Text style={{ fontSize: 10, color: '#999', marginTop: 4, textAlign: 'center', fontWeight: '600' }} numberOfLines={2}>
          {outfitItem.item.name || outfitItem.searchQuery || 'Item'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, '#F8F9FA', Colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Header (Matching Image) */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topBarCircle} onPress={() => router.replace('/(tabs)')}>
            <Ionicons name="chevron-back" size={20} color="#000" />
          </TouchableOpacity>

          <View style={styles.weatherWidget}>
            <Ionicons name="sunny" size={20} color="#FFA500" />
            <View>
              <Text style={styles.weatherTemp}>32°</Text>
              <Text style={styles.weatherHiLo}>H:33° L:26°</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.topBarCircle} onPress={() => setShowHistory(true)}>
            <Ionicons name="time-outline" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* ── Chat Messages ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View style={styles.welcomeContainer}>
              <View style={styles.aiAvatarSmall}>
                <Ionicons name="sparkles" size={16} color="#fff" />
              </View>
              <Text style={styles.welcomeTitle}>ATLA AI STYLIST</Text>
              <Text style={styles.welcomeSub}>Personalized styling from your closet</Text>
            </View>
          )}

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
                msg.type === 'user' ? styles.userRow : styles.aiRow,
                (msg.outfits && msg.outfits.length > 0) ? { paddingHorizontal: 0 } : { paddingHorizontal: 20 }
              ]}
            >
              {msg.type === 'ai' && !(msg.outfits && msg.outfits.length > 0) && (
                <View style={styles.aiAvatarBubble}>
                  <Ionicons name="sparkles" size={12} color="#000" />
                </View>
              )}
              <View style={[styles.messageBubbleContainer, (msg.outfits && msg.outfits.length > 0) && { maxWidth: '100%', width: '100%' }]}>
                {msg.type === 'user' ? (
                  <View style={styles.userBubble}>
                    <Text style={styles.userText}>{msg.text}</Text>
                  </View>
                ) : (
                  <View style={styles.aiContent}>
                    {/* Visual Outfit Cards (Masonry Style) */}
                    {msg.outfits && msg.outfits.length > 0 && (
                      <View style={{ marginTop: 0 }}>
                        {msg.outfits.map((outfit: any, oIdx: number) => (
                          <View key={oIdx} style={styles.modernCard}>
                            <View style={styles.modernHeader}>
                              <Text style={styles.modernTitle}>{outfit.name || 'AI Suggested Look'}</Text>
                              <Text style={styles.modernSub}>{outfit.occasion || 'Styled for you'}</Text>
                            </View>

                            <View style={styles.masonryGrid}>
                              <View style={styles.masonryCol}>
                                {renderMasonryItem(outfit.items[0], true)}
                                {renderMasonryItem(outfit.items[2], false)}
                              </View>
                              <View style={styles.masonryCol}>
                                {renderMasonryItem(outfit.items[1], false)}
                                {renderMasonryItem(outfit.items[3], true)}
                              </View>
                            </View>

                            {/* Item Labels Row */}
                            <View style={styles.itemLabelsRow}>
                              {outfit.items.slice(0, 4).map((itm: any, iIdx: number) => (
                                <View key={iIdx} style={styles.itemLabel}>
                                  <Text style={styles.itemLabelType}>{(itm.type || '').toUpperCase()}</Text>
                                  <Text style={styles.itemLabelName} numberOfLines={1}>{itm.item?.name || itm.name || ''}</Text>
                                  {itm.item?.price ? <Text style={styles.itemLabelPrice}>{itm.item.price}</Text> : null}
                                </View>
                              ))}
                            </View>

                            <Text style={styles.modernAdvice}>{outfit.stylingAdvice}</Text>

                            <View style={styles.modernActions}>
                              <View style={styles.modernActionIcons}>
                                <TouchableOpacity><Ionicons name="heart-outline" size={24} color="#000" /></TouchableOpacity>
                                <TouchableOpacity><Ionicons name="pencil-outline" size={24} color="#000" /></TouchableOpacity>
                                <TouchableOpacity><Ionicons name="thumbs-down-outline" size={24} color="#000" /></TouchableOpacity>
                                <TouchableOpacity><Ionicons name="paper-plane-outline" size={24} color="#000" /></TouchableOpacity>
                              </View>
                              <TouchableOpacity style={styles.createAvatarBtn} onPress={() => handleTryOn(outfit.items[0]?.item)}>
                                <Text style={styles.createAvatarText}>Create Avatar</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

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

        {/* Floating Pill Input */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.floatingInputWrapper}>
          <View style={styles.floatingInputInner}>
            <TouchableOpacity style={styles.floatingInputIcon} onPress={handlePickImage}>
              <Ionicons name="image-outline" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.floatingInputIcon}>
              <Ionicons name="shirt-outline" size={20} color="#666" />
            </TouchableOpacity>
            
            <TextInput
              style={styles.floatingInput}
              placeholder="Refine your looks..."
              placeholderTextColor="#999"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              multiline={false}
            />
            
            <TouchableOpacity style={styles.floatingInputIcon}>
              <Ionicons name="mic-outline" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.floatingInputIcon, styles.floatingSendBtn]} onPress={handleSend} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Ionicons name="arrow-forward" size={16} color="#ccc" />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── Chat History Modal ── */}
      <Modal visible={showHistory} transparent animationType="slide">
        <View style={styles.historyOverlay}>
          <View style={styles.historySheet}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>CHAT HISTORY</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.historyCloseBtn}>
                <Ionicons name="close" size={22} color="#000" />
              </TouchableOpacity>
            </View>

            {chatSessions.length === 0 ? (
              <View style={styles.historyEmpty}>
                <Ionicons name="chatbubble-outline" size={40} color="#ccc" />
                <Text style={styles.historyEmptyText}>No chat history yet</Text>
                <Text style={styles.historyEmptyHint}>Your conversations will appear here</Text>
              </View>
            ) : (
              <FlatList
                data={chatSessions}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.historyItem}
                    onPress={() => loadSession(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.historyItemIcon}>
                      <Ionicons name="sparkles" size={14} color="#000" />
                    </View>
                    <View style={styles.historyItemContent}>
                      <Text style={styles.historyItemTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.historyItemDate}>
                        {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {' · '}{item.messages.length} messages
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => deleteSession(item.id)}
                      style={styles.historyDeleteBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ccc" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              />
            )}

            <TouchableOpacity style={styles.newChatFullBtn} onPress={startNewChat}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.newChatFullText}>START NEW CHAT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
                  <TouchableOpacity
                    style={{ backgroundColor: '#000', paddingVertical: 12, borderRadius: 24, marginTop: 12, alignItems: 'center' }}
                    onPress={async () => {
                      if (!userId) return;
                      try {
                        const res = await fetch(`${BACKEND_URL}/api/outfits`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            userId,
                            name: 'AI Avatar Look',
                            occasion: 'Virtual Try-On',
                            itemIds: [],
                            aiGenerated: true,
                            imageUrl: tryOnResult,
                          }),
                        });
                        const d = await res.json();
                        if (d.success) {
                          alert('Look saved to Outfits!');
                          setTryOnResult(null);
                        }
                      } catch (e) {}
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 }}>SAVE TO OUTFITS</Text>
                  </TouchableOpacity>
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
    paddingHorizontal: 0,
    paddingBottom: 100,
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
    width: 150, // Slightly wider
    backgroundColor: '#fff',
    borderRadius: 20, // More rounded
    marginRight: 16, // More space between cards
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    ...Shadows.sm,
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
    paddingVertical: 18, // More breathing room
    paddingHorizontal: 20,
    borderRadius: 24, // More rounded
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
  // Modern Masonry Card Layout
  modernCard: {
    backgroundColor: '#fff',
    borderRadius: 0,
    marginBottom: 40,
    paddingVertical: 16,
  },
  modernHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  modernTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  modernSub: {
    fontSize: 14,
    color: '#666',
  },
  masonryGrid: {
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 0,
  },
  masonryCol: {
    flex: 1,
    gap: 2,
  },
  masonryTall: {
    width: '100%',
    aspectRatio: 0.7,
    backgroundColor: '#F5F5F5',
  },
  masonryShort: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
  },
  closetBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  closetBadgeText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  itemLabelsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: 12,
    gap: 6,
  },
  itemLabel: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  itemLabelType: {
    fontSize: 8,
    fontWeight: '800',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 2,
  },
  itemLabelName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  itemLabelPrice: {
    fontSize: 9,
    fontWeight: '700',
    color: '#000',
    marginTop: 2,
  },
  modernAdvice: {
    fontSize: 14,
    color: '#333',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  modernActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modernActionIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  createAvatarBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createAvatarText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // Floating Input
  floatingInputWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 10,
    left: 16,
    right: 16,
  },
  floatingInputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  floatingInputIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 4,
  },
  floatingInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    paddingHorizontal: 8,
  },
  floatingSendBtn: {
    backgroundColor: '#F0F0F0',
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  topBarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weatherTemp: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  weatherHiLo: {
    fontSize: 10,
    color: '#666',
  },

  // ── Chat History ──
  historyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  historySheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#000',
  },
  historyCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyEmpty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  historyEmptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  historyEmptyHint: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 12,
  },
  historyItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyItemContent: {
    flex: 1,
    gap: 3,
  },
  historyItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  historyItemDate: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  historyDeleteBtn: {
    padding: 4,
  },
  newChatFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    margin: 20,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  newChatFullText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
