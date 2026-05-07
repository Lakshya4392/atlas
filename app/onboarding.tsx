import React from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  StatusBar, Platform, TextInput, KeyboardAvoidingView, ActivityIndicator, Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function Onboarding() {
  const [showForm, setShowForm] = React.useState(false);
  const [isLogin, setIsLogin] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // Dynamically resolve the backend URL based on the Expo bundler IP
  // This completely eliminates the "Network Error" on Android and physical devices
  const getBackendUrl = () => {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:3000`;
    }
    return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
  };

  const BACKEND_URL = getBackendUrl();

  const handleRegister = async () => {
    const finalName = isLogin ? 'Returning User' : name;
    
    if ((!isLogin && !name.trim()) || !email.trim()) {
      Alert.alert('Error', isLogin ? 'Please enter your email' : 'Please enter your name and email');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: finalName, email }),
      });
      const data = await res.json();
      
      if (data.success) {
        // Save session locally
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        router.replace('/(tabs)');
      } else {
        Alert.alert('Registration Failed', data.error || 'Something went wrong');
      }
    } catch (e: any) {
      console.error('Registration network error:', e, 'Backend URL:', BACKEND_URL);
      Alert.alert('Network Error', `Could not reach backend at ${BACKEND_URL}. Make sure the server is running with: cd server && npm run dev`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    setIsLogin(false);
    setShowForm(true);
  };

  const handleAlreadyHaveAccount = () => {
    setIsLogin(true);
    setShowForm(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* 
        Ultra-smooth gradient from deep black to pure white.
        It covers the top 60% of the screen and blends seamlessly into the white background.
      */}
      <LinearGradient
        colors={['#000000', '#111111', '#555555', '#FFFFFF']}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.gradient}
      />

      <View style={styles.safeArea}>
        {/* Top Logo Section - positioned perfectly like the reference */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="shirt-outline" size={36} color="#FFFFFF" />
            <Text style={styles.logoText}>Atla</Text>
          </View>
        </View>

        {/* 
          Image removed as requested ("sirf graidnent use kar liek inr ef image better premium fee").
          We keep the exact spatial layout so the text and buttons sit perfectly.
        */}
        <View style={styles.emptySpaceForGradient} />

        {/* Text and Controls Section - Exact layout clone of the reference */}
        <View style={styles.bottomSection}>
          <Text style={styles.title}>
            Style, done for you.{'\n'}Anytime, anywhere.
          </Text>

          <View style={styles.actionButtons}>
            {showForm ? (
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
                <Text style={styles.formTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
                
                {!isLogin && (
                  <TextInput
                    style={styles.input}
                    placeholder="Your Name"
                    placeholderTextColor="#999"
                    value={name}
                    onChangeText={setName}
                  />
                )}
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>{isLogin ? 'Login' : 'Create Account'}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowForm(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </KeyboardAvoidingView>
            ) : (
              <>
                <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted} activeOpacity={0.8}>
                  <Text style={styles.primaryButtonText}>Get Started</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={handleAlreadyHaveAccount} activeOpacity={0.8}>
                  <Text style={styles.secondaryButtonText}>I already have an account</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          
          <Text style={styles.termsText}>
            By continuing you agree to our Terms of Services{'\n'}and Privacy Policy
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure white background for the bottom part
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.65, // exactly 65% of screen, ends in pure white
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingTop: height * 0.15, // Pushed down exactly like the reference image
    alignItems: 'center',
    zIndex: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginLeft: 10,
    letterSpacing: -0.5,
  },
  emptySpaceForGradient: {
    flex: 1,
    // This empty view takes up the space where the 3D image was,
    // pushing the text down to the exact 60% mark like the reference image.
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 40,
    letterSpacing: -0.5,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  actionButtons: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#111111',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F0F0F0', // Very light grey just like the reference
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  input: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    fontSize: 16,
    color: '#000',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  cancelButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
});
