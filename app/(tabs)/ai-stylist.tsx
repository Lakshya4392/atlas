import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USER_PROFILE } from '../../constants/data';
import { Colors, Shadows } from '../../constants/theme';
import { generateOutfitSuggestion } from '../../services/ai';
import { fetchWeather } from '../../services/weather';

const { width, height } = Dimensions.get('window');

// Standardized Design System via Colors & Shadows


export default function AIStylistScreen() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [wardrobe, setWardrobe] = useState<any[]>([]);
  const scrollRef = useRef<ScrollView>(null);

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
  const userId = 'cmov05vfc0000zjtlv91cfopo';

  React.useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userPrompt = input;
    setMessages(prev => [...prev, { type: 'user', text: userPrompt }]);
    setInput('');
    setLoading(true);

    const weather = await fetchWeather(40.7128, -74.0060);
    const aiRaw = await generateOutfitSuggestion(userPrompt, wardrobe, weather, USER_PROFILE);
    
    try {
      const parsed = JSON.parse(aiRaw);
      const fullOutfit = parsed.outfit.map((o: any) => ({
        ...o,
        item: wardrobe.find(w => w.id === o.id)
      })).filter((o: any) => o.item);
      
      setMessages(prev => [...prev, { type: 'ai', ...parsed, outfit: fullOutfit }]);
    } catch (err) {
      setMessages(prev => [...prev, { type: 'ai', stylingAdvice: aiRaw }]);
    }
    setLoading(false);
  };

  const startNewChat = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <View style={styles.container}>
      {/* ── Soft Premium Gradient Background ── */}
      <LinearGradient
        colors={['#F5F7FA', '#E4EBF5']}
        style={StyleSheet.absoluteFillObject}
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
          <TouchableOpacity style={styles.circleBtn} onPress={() => router.push('/(tabs)')} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── Center Content ── */}
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            ref={scrollRef}
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
          >
            {messages.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Text style={styles.greeting}>Good morning, {USER_PROFILE.name}</Text>
                <Text style={styles.question}>How can I style you today?</Text>
              </View>
            )}

            {messages.map((msg, index) => (
              <View key={index} style={[styles.messageRow, msg.type === 'user' ? styles.userRow : styles.aiRow]}>
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
                              <Image source={{ uri: o.item.imageUrl }} style={styles.cardImage} />
                            </View>
                            <Text style={styles.cardItemName}>{o.item.name.toUpperCase()}</Text>
                          </View>
                        ))}
                      </ScrollView>
                    )}

                    <View style={styles.aiTextContent}>
                      <Text style={styles.aiWeather}>{msg.weatherContext?.toUpperCase()}</Text>
                      <Text style={styles.aiAdvice}>{msg.stylingAdvice}</Text>
                      {msg.idealAddition && (
                        <View style={styles.aiIdeal}>
                          <Text style={styles.idealLabel}>IDEAL ADDITION</Text>
                          <Text style={styles.idealText}>{msg.idealAddition}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            ))}

            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={Colors.textPrimary} />
                <Text style={styles.loadingText}>Styling your look...</Text>
              </View>
            )}
          </ScrollView>

          {/* ── Floating Input Bar ── */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>

              {/* Left Icons */}
              <View style={styles.leftIcons}>
                <TouchableOpacity style={styles.iconBtn}>
                  <Ionicons name="image-outline" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn}>
                  <Ionicons name="shirt-outline" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Text Input */}
              <TextInput
                style={styles.input}
                placeholder="Athleisure looks for brunch with friends..."
                placeholderTextColor={Colors.textSecondary}
                value={input}
                onChangeText={setInput}
                multiline
              />

              {/* Right Icons */}
              <View style={styles.rightIcons}>
                <TouchableOpacity style={styles.iconBtn}>
                  <Ionicons name="mic-outline" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.sendBtn} disabled={!input.trim()} onPress={handleSend}>
                  <Ionicons name="arrow-forward" size={18} color={input.trim() ? Colors.textPrimary : Colors.textSecondary} />
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    marginBottom: 10,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  newChatText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyState: {
    height: height * 0.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 8,
    fontWeight: '300',
  },
  question: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  messageRow: {
    marginVertical: 12,
    width: '100%',
  },
  userRow: {
    alignItems: 'flex-end',
  },
  aiRow: {
    alignItems: 'flex-start',
  },
  userBubble: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    maxWidth: '80%',
  },
  userText: {
    color: '#fff',
    fontSize: 15,
  },
  aiContent: {
    width: '100%',
  },
  outfitScroll: {
    gap: 12,
    paddingBottom: 16,
  },
  outfitCard: {
    width: 150,
  },
  cardImageWrapper: {
    width: 150,
    height: 190,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    ...Shadows.sm,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardItemName: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  aiTextContent: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 16,
    borderRadius: 20,
    borderTopLeftRadius: 4,
  },
  aiWeather: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  aiAdvice: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  aiIdeal: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  idealLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  idealText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontStyle: 'italic',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    minHeight: 64,
  },
  leftIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  iconBtn: {
    padding: 8,
    marginHorizontal: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
