import React from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  StatusBar, Platform, TextInput, ActivityIndicator, Alert, ScrollView, SafeAreaView, LayoutAnimation, UIManager
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/contexts/AuthContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const OCCUPATIONS = ['Lawyer', 'Marketing', 'Engineer', 'Student', 'Teacher', 'Consultant', 'Healthcare', 'Designer'];
const SOURCES = [
  { id: 'TikTok', icon: 'logo-tiktok' },
  { id: 'Instagram', icon: 'logo-instagram' },
  { id: 'Reddit', icon: 'logo-reddit' },
  { id: 'Friend', icon: 'person' },
  { id: 'ChatGPT', icon: 'chatbubbles' },
  { id: 'Google', icon: 'logo-google' },
  { id: 'TV Show', icon: 'tv-outline' },
  { id: 'Other', icon: 'globe-outline' }
];
const BRANDS = ['A.P.C.', 'AMI Paris', 'Acne Studios', 'Aritzia', 'Zara', 'H&M', 'Nike', 'Lululemon', 'Fear of God', 'Loro Piana', 'Prada', 'Gucci'];

export default function Onboarding() {
  const { state: authState } = useAuth();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  // Form State
  const [occupation, setOccupation] = React.useState('');
  const [wearPref, setWearPref] = React.useState('');
  const [hearSource, setHearSource] = React.useState('');
  const [selectedBrands, setSelectedBrands] = React.useState<string[]>([]);

  const getBackendUrl = () => {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:3000`;
    }
    return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
  };
  const BACKEND_URL = getBackendUrl();

  const handleNext = () => {
    if (step === 1 && !occupation.trim()) {
      Alert.alert('Required', 'Please enter or select an occupation');
      return;
    }
    if (step === 2 && !wearPref) {
      Alert.alert('Required', 'Please select your style preference');
      return;
    }
    if (step === 3 && !hearSource) {
      Alert.alert('Required', 'Please select how you heard about us');
      return;
    }

    if (step < 4) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleFinish = async () => {
    const userId = authState.user?.id;
    if (!userId) {
      router.replace('/(tabs)');
      return;
    }
    setLoading(true);
    try {
      await fetch(`${BACKEND_URL}/api/user/${userId}/onboarding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occupation,
          wearPreference: wearPref,
          hearSource,
          brands: selectedBrands
        }),
      });
      // Pre-fetch feed
      fetch(`${BACKEND_URL}/api/fashion/feed/${userId}`).catch(()=>console.log('prefetch silent catch'));
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      router.replace('/(tabs)');
    } catch (e) {
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter(b => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  const renderProgress = () => {
    return (
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map(idx => (
          <View key={idx} style={[styles.progressDot, step >= idx && styles.progressDotActive]} />
        ))}
      </View>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="briefcase-outline" size={28} color="#000" />
            </View>
            <Text style={styles.title}>What <Text style={styles.italic}>do you do</Text>{'\n'}for work?</Text>
            <Text style={styles.subtitle}>We'll personalize recommendations for both weekdays and weekends.</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="search-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Type your occupation..." 
                placeholderTextColor="#999" 
                value={occupation} 
                onChangeText={setOccupation} 
              />
            </View>

            <View style={styles.pillContainer}>
              {OCCUPATIONS.map(occ => (
                <TouchableOpacity key={occ} style={[styles.pill, occupation === occ && styles.pillActive]} onPress={() => setOccupation(occ)}>
                  <Text style={[styles.pillText, occupation === occ && styles.pillTextActive]}>{occ}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="shirt-outline" size={28} color="#000" />
            </View>
            <Text style={styles.title}>What do you{'\n'}<Text style={styles.italic}>wear</Text>?</Text>
            <Text style={styles.subtitle}>Help us tailor your fashion feed and AI recommendations.</Text>

            <View style={styles.grid2}>
              <TouchableOpacity style={[styles.wearBtn, wearPref === 'Womenswear' && styles.wearBtnActive]} onPress={() => setWearPref('Womenswear')}>
                <View style={styles.wearBtnInner}>
                  <View style={[styles.radioCircle, wearPref === 'Womenswear' && styles.radioActive]}>
                    {wearPref === 'Womenswear' && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.wearBtnText}>Womenswear</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.wearBtn, wearPref === 'Menswear' && styles.wearBtnActive]} onPress={() => setWearPref('Menswear')}>
                <View style={styles.wearBtnInner}>
                  <View style={[styles.radioCircle, wearPref === 'Menswear' && styles.radioActive]}>
                    {wearPref === 'Menswear' && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.wearBtnText}>Menswear</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="megaphone-outline" size={28} color="#000" />
            </View>
            <Text style={styles.title}>How did you{'\n'}hear about us?</Text>
            <Text style={styles.subtitle}>We're curious to know how you found VEYRA.</Text>
            
            <View style={styles.sourceGrid}>
              {SOURCES.map((src, index) => (
                <TouchableOpacity 
                  key={src.id} 
                  style={[
                    styles.sourceCell,
                    index % 2 === 0 ? styles.cellLeft : styles.cellRight,
                    hearSource === src.id && styles.sourceCellActive
                  ]} 
                  onPress={() => setHearSource(src.id)}
                >
                  <View style={[styles.radioCircle, hearSource === src.id && styles.radioActive]}>
                    {hearSource === src.id && <View style={styles.radioDot} />}
                  </View>
                  <Ionicons name={src.icon as any} size={18} color="#000" />
                  <Text style={styles.sourceText}>{src.id}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.brandTag}>FINAL STEP</Text>
            <Text style={styles.title}>Choose 3 or{'\n'}more <Text style={styles.italic}>brands</Text></Text>
            <Text style={styles.subtitle}>Select the brands you currently own or aspire to own.</Text>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color="#ccc" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Search brands..." placeholderTextColor="#ccc" />
            </View>

            <View style={styles.brandsContainer}>
              {BRANDS.map((brand) => {
                const isSelected = selectedBrands.includes(brand);
                return (
                  <TouchableOpacity 
                    key={brand} 
                    style={[styles.brandItem, isSelected && styles.brandItemActive]} 
                    onPress={() => toggleBrand(brand)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.brandName, isSelected && styles.brandNameActive]}>{brand}</Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color="#000" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ height: 100 }} />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          {renderProgress()}
          {step === 4 ? (
            <TouchableOpacity onPress={handleFinish}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} /> // Placeholder for alignment
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderStep()}
        </ScrollView>

        <View style={styles.footer}>
          {step === 4 ? (
            <TouchableOpacity 
              style={[styles.primaryButton, selectedBrands.length < 3 && styles.primaryButtonDisabled]} 
              onPress={handleFinish} 
              disabled={loading || selectedBrands.length < 3}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    {selectedBrands.length < 3 ? `Select ${3 - selectedBrands.length} more` : 'Complete Setup'}
                  </Text>
                  {selectedBrands.length >= 3 && <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />}
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={handleNext} disabled={loading} activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backBtn: { 
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#999' 
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F0F0F0',
  },
  progressDotActive: {
    backgroundColor: '#000',
  },
  scrollContent: { 
    paddingHorizontal: 28,
    paddingTop: 10,
    paddingBottom: 100,
  },
  stepContent: { 
    marginTop: 10 
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  brandTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#999',
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#000',
    lineHeight: 46,
    letterSpacing: -1,
    marginBottom: 16,
  },
  italic: {
    fontStyle: 'italic',
    fontWeight: '400',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
    lineHeight: 24,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 20,
    height: 64,
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
    height: '100%',
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
  },
  pillActive: { 
    backgroundColor: '#000' 
  },
  pillText: { 
    fontSize: 15, 
    fontWeight: '500', 
    color: '#000' 
  },
  pillTextActive: { 
    color: '#FFF' 
  },
  grid2: {
    flexDirection: 'row',
    gap: 16,
  },
  wearBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 2,
  },
  wearBtnActive: { 
    backgroundColor: '#000',
  },
  wearBtnInner: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 24,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 140,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  radioActive: {
    borderColor: '#000',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#000',
  },
  wearBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 'auto',
  },
  sourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  sourceCell: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  cellLeft: { borderRightWidth: 1, borderRightColor: '#F0F0F0' },
  cellRight: {},
  sourceCellActive: { backgroundColor: '#F0F0F0' },
  sourceText: { fontSize: 15, fontWeight: '500', color: '#000' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    height: 56,
    borderRadius: 16,
    marginBottom: 16,
  },
  brandsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  brandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
  },
  brandItemActive: {
    backgroundColor: '#F0F0F0',
    borderColor: '#000',
    borderWidth: 2,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  brandName: { fontSize: 16, fontWeight: '500', color: '#000' },
  brandNameActive: { fontWeight: '700' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#000',
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
