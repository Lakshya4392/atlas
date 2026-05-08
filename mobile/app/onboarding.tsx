import React from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  StatusBar, Platform, TextInput, KeyboardAvoidingView, ActivityIndicator, Alert, ScrollView, SafeAreaView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const OCCUPATIONS = ['Lawyer', 'Marketing lead', 'Software Engineer', 'College Student', 'High School Student', 'Teacher', 'Consultant', 'Nurse', 'Product designer'];
const SOURCES = [
  { id: 'Tiktok', icon: 'logo-tiktok' },
  { id: 'Instagram', icon: 'logo-instagram' },
  { id: 'Reddit', icon: 'logo-reddit' },
  { id: 'Friend', icon: 'person' },
  { id: 'ChatGPT', icon: 'chatbubbles' },
  { id: 'Google', icon: 'logo-google' },
  { id: 'Other', icon: 'globe-outline' },
  { id: 'TV Show', icon: 'tv-outline' }
];
const BRANDS = ['A.P.C.', 'AMI Paris', 'Acne Studios', 'Aritzia', 'Zara', 'H&M', 'Nike', 'Lululemon', 'Fear of God', 'Loro Piana'];

export default function Onboarding() {
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [registeredUserId, setRegisteredUserId] = React.useState<string | null>(null);

  // Form State
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState(''); // Required for auth
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

  const handleNext = async () => {
    if (step === 1) {
      if (!firstName || !lastName || !email) {
        Alert.alert('Missing Info', 'Please enter your first name, last name, and email to continue.');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `${firstName} ${lastName}`, email }),
        });
        const data = await res.json();
        if (data.success) {
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
          setRegisteredUserId(data.user.id);
          setStep(2);
        } else {
          Alert.alert('Registration Failed', data.error);
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Could not connect to server.');
      } finally {
        setLoading(false);
      }
    } else if (step < 5) {
      setStep(step + 1);
    } else {
      await handleFinish();
    }
  };

  const handleFinish = async () => {
    if (!registeredUserId) return;
    setLoading(true);
    try {
      await fetch(`${BACKEND_URL}/api/user/${registeredUserId}/onboarding`, {
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
      fetch(`${BACKEND_URL}/api/fashion/feed/${registeredUserId}`).catch(()=>console.log('prefetch silent catch'));
      router.replace('/(tabs)');
    } catch (e) {
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) setSelectedBrands(selectedBrands.filter(b => b !== brand));
    else setSelectedBrands([...selectedBrands, brand]);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={28} color="#000" />
            </View>
            <Text style={styles.title}>Your <Text style={styles.italic}>name</Text></Text>
            <Text style={styles.subtitle}>Please enter your first and last{'\n'}name to continue</Text>

            <View style={styles.inputStack}>
              <TextInput style={styles.stackedInputTop} placeholder="FIRST NAME" placeholderTextColor="#000" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
              <TextInput style={styles.stackedInputMiddle} placeholder="LAST NAME" placeholderTextColor="#000" value={lastName} onChangeText={setLastName} autoCapitalize="words" />
              <TextInput style={styles.stackedInputBottom} placeholder="EMAIL" placeholderTextColor="#000" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.title}>What <Text style={styles.italic}>do you do</Text>{'\n'}for work?</Text>
            <Text style={styles.subtitle}>We'll personalize recommendations{'\n'}for both weekdays and weekends</Text>

            <TextInput style={styles.singleInput} placeholder="Type or selection occupation" placeholderTextColor="#999" value={occupation} onChangeText={setOccupation} />

            <View style={styles.pillContainer}>
              {OCCUPATIONS.map(occ => (
                <TouchableOpacity key={occ} style={[styles.pill, occupation === occ && styles.pillActive]} onPress={() => setOccupation(occ)}>
                  <Text style={[styles.pillText, occupation === occ && styles.pillTextActive]}>{occ}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-add-outline" size={28} color="#000" />
            </View>
            <Text style={styles.title}>What do you{'\n'}<Text style={styles.italic}>wear</Text>?</Text>
            <Text style={styles.subtitle}>You can choose both options if{'\n'}you're interested in both styles</Text>

            <View style={styles.grid2}>
              <TouchableOpacity style={[styles.wearBtn, wearPref === 'Womenswear' && styles.wearBtnActive]} onPress={() => setWearPref('Womenswear')}>
                <View style={[styles.radioCircle, wearPref === 'Womenswear' && styles.radioActive]} />
                <Text style={styles.wearBtnText}>Womenswear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.wearBtn, wearPref === 'Menswear' && styles.wearBtnActive]} onPress={() => setWearPref('Menswear')}>
                <View style={[styles.radioCircle, wearPref === 'Menswear' && styles.radioActive]} />
                <Text style={styles.wearBtnText}>Menswear</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="radio-outline" size={28} color="#000" />
            </View>
            <Text style={styles.title}>How did you{'\n'}hear about us?</Text>
            
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
                  <View style={[styles.radioCircle, hearSource === src.id && styles.radioActive]} />
                  <Ionicons name={src.icon as any} size={18} color="#000" />
                  <Text style={styles.sourceText}>{src.id}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Choose 3 or{'\n'}more <Text style={styles.italic}>brands</Text></Text>
            <Text style={styles.subtitle}>Choose brands of clothes you currently own or want</Text>

            <View style={styles.searchBox}>
              <Text style={styles.searchPlaceholder}>Search or add brands...</Text>
              <Ionicons name="search" size={20} color="#ccc" />
            </View>

            {BRANDS.map((brand) => {
              const isSelected = selectedBrands.includes(brand);
              return (
                <View key={brand} style={styles.brandRow}>
                  <Text style={styles.brandName}>{brand}</Text>
                  <TouchableOpacity style={styles.heartBtn} onPress={() => toggleBrand(brand)}>
                    <Ionicons name={isSelected ? "heart" : "heart-outline"} size={22} color={isSelected ? "red" : "#000"} />
                  </TouchableOpacity>
                </View>
              );
            })}
            <View style={{ height: 100 }} /> {/* Padding for bottom button */}
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
        
        {/* Top Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          {step === 5 && (
            <TouchableOpacity onPress={handleFinish}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderStep()}
        </ScrollView>

        {/* Footer Button */}
        <View style={styles.footer}>
          {step === 5 ? (
            <TouchableOpacity 
              style={[styles.primaryButton, selectedBrands.length < 3 && styles.primaryButtonDisabled]} 
              onPress={handleFinish} 
              disabled={loading || selectedBrands.length < 3}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>{selectedBrands.length < 3 ? 'Like at least 3 brands' : 'Continue'}</Text>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={handleNext} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Continue</Text>}
            </TouchableOpacity>
          )}
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 24 },
  
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backBtn: { padding: 4, marginLeft: -4 },
  skipText: { fontSize: 16, fontWeight: '600', color: '#000' },
  
  scrollContent: { paddingBottom: 100 },
  stepContent: { marginTop: 10 },
  
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: '500',
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
    color: '#000',
    fontWeight: '500',
    lineHeight: 24,
    marginBottom: 32,
  },
  
  // Inputs
  inputStack: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  stackedInputTop: {
    backgroundColor: '#F5F5F5',
    padding: 20,
    fontSize: 14,
    fontWeight: '500',
    borderBottomWidth: 2,
    borderBottomColor: '#FFF',
  },
  stackedInputMiddle: {
    backgroundColor: '#F5F5F5',
    padding: 20,
    fontSize: 14,
    fontWeight: '500',
    borderBottomWidth: 2,
    borderBottomColor: '#FFF',
  },
  stackedInputBottom: {
    backgroundColor: '#F5F5F5',
    padding: 20,
    fontSize: 14,
    fontWeight: '500',
  },
  singleInput: {
    backgroundColor: '#F5F5F5',
    padding: 20,
    fontSize: 14,
    fontWeight: '500',
    borderRadius: 8,
    marginBottom: 32,
  },
  
  // Pills
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
  },
  pillActive: { backgroundColor: '#000' },
  pillText: { fontSize: 14, fontWeight: '500', color: '#000' },
  pillTextActive: { color: '#FFF' },
  
  // Radio Grid
  grid2: {
    flexDirection: 'row',
    gap: 12,
  },
  wearBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    height: 120,
    padding: 20,
    borderRadius: 8,
    justifyContent: 'space-between',
  },
  wearBtnActive: { backgroundColor: '#EAEAEA' }, // subtle active state
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCC',
    backgroundColor: '#FFF',
  },
  radioActive: {
    borderWidth: 6,
    borderColor: '#000',
  },
  wearBtnText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  
  // Sources Grid
  sourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sourceCell: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFF',
    gap: 12,
  },
  cellLeft: { borderRightWidth: 1, borderRightColor: '#FFF' },
  cellRight: {},
  sourceCellActive: { backgroundColor: '#F0F0F0' },
  sourceText: { fontSize: 14, fontWeight: '500', color: '#000' },
  
  // Brands Search & List
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 2,
  },
  searchPlaceholder: { fontSize: 16, color: '#999', fontWeight: '500' },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    padding: 16,
    marginBottom: 2,
  },
  brandName: { fontSize: 16, fontWeight: '500', color: '#000' },
  heartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 24,
    left: 24,
    right: 24,
  },
  primaryButton: {
    backgroundColor: '#000',
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#000',
    opacity: 1, // keeping black as per image but text changes
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
