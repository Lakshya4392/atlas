import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, StatusBar, Image, Animated, Dimensions, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const { register, state } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const errorAnim = useRef(new Animated.Value(0)).current;
  const errorShake = useRef(new Animated.Value(0)).current;

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, delay: 100, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, damping: 22, stiffness: 130, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  const showError = (msg: string) => {
    setError(msg);
    errorAnim.setValue(0);
    errorShake.setValue(0);
    Animated.parallel([
      Animated.spring(errorAnim, { toValue: 1, damping: 15, stiffness: 150, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(errorShake, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]),
    ]).start();
    setTimeout(() => {
      Animated.timing(errorAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setError(''));
    }, 4000);
  };

  const handleRegister = async () => {
    setError('');
    if (!firstName.trim() || !lastName.trim()) {
      showError('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      showError('Please enter your email address');
      return;
    }
    if (!password.trim()) {
      showError('Please create a password');
      return;
    }
    if (password.trim().length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    try {
      await register(`${firstName.trim()} ${lastName.trim()}`, email.trim(), password.trim());
      router.replace('/onboarding');
    } catch (error: any) {
      const msg = error.message || 'Something went wrong';
      if (msg.toLowerCase().includes('exists') || msg.toLowerCase().includes('already')) {
        showError('An account with this email already exists');
      } else {
        showError(msg);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <Animated.View style={{ flex: 1, opacity: fadeIn, transform: [{ translateY: slideUp }] }}>

            {/* Hero Image — edge to edge, no gap from top */}
            <View style={styles.heroCard}>
              <Image
                source={require('../assets/images/auth_hero.png')}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </View>

            {/* Content below image */}
            <View style={styles.formWrapper}>
              {/* Title */}
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join VEYRA and discover your style</Text>

              {/* Form */}
              <View style={styles.form}>
                <View style={styles.nameRow}>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="First Name"
                      placeholderTextColor="#C0C0C0"
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Last Name"
                      placeholderTextColor="#C0C0C0"
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={18} color="#C0C0C0" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#C0C0C0"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={18} color="#C0C0C0" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Create Password"
                    placeholderTextColor="#C0C0C0"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#C0C0C0" />
                  </TouchableOpacity>
                </View>

                {/* Sign Up */}
                <TouchableOpacity
                  style={[styles.primaryBtn, state.isLoading && styles.primaryBtnDisabled]}
                  onPress={handleRegister}
                  disabled={state.isLoading}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>
                    {state.isLoading ? 'Creating account...' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>

                {/* Terms */}
                <Text style={styles.termsText}>
                  By signing up, you agree to our{' '}
                  <Text style={styles.termsLink}>Terms</Text> &{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>

              {/* Inline Error Toast */}
              {error !== '' && (
                <Animated.View style={[
                  styles.errorBanner,
                  { opacity: errorAnim, transform: [{ translateX: errorShake }, { scale: errorAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }
                ]}>
                  <Ionicons name="alert-circle" size={18} color="#FF3B30" />
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity onPress={() => { Animated.timing(errorAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setError('')); }} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                    <Ionicons name="close" size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.replace('/login')}>
                  <Text style={styles.footerLink}>Sign in</Text>
                </TouchableOpacity>
              </View>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const SIDE = 24;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Hero — flush to top, rounded bottom
  heroCard: {
    width: '100%',
    height: height * 0.32,
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    backgroundColor: '#F0EDE8',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },

  // Form area
  formWrapper: {
    flex: 1,
    paddingHorizontal: SIDE,
    paddingTop: 20,
  },

  // Title
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAA',
    fontWeight: '400',
    marginBottom: 16,
  },

  // Form
  form: {
    gap: 10,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
    height: '100%',
  },
  termsText: {
    fontSize: 12,
    color: '#C0C0C0',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 2,
  },
  termsLink: {
    color: '#000',
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#000',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 0.3,
  },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFE0E0',
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#CC1A1A',
    fontWeight: '500',
    lineHeight: 18,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 24,
  },
  footerText: {
    fontSize: 14,
    color: '#AAA',
  },
  footerLink: {
    fontSize: 14,
    color: '#000',
    fontWeight: '700',
  },
});
