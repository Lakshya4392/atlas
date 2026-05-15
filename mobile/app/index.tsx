import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, StatusBar } from 'react-native';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const hasOnboarded = await AsyncStorage.getItem('onboardingCompleted');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        if (hasOnboarded === 'true') {
          setOnboarded(true);
        }
      } catch (e) {
        console.error('Session check error:', e);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  // ── Returning user with completed onboarding → straight to home ──
  if (user && onboarded) {
    return <Redirect href="/(tabs)" />;
  }

  // ── Logged in but hasn't completed onboarding → finish setup ──
  if (user && !onboarded) {
    return <Redirect href="/onboarding" />;
  }

  // ── New user → premium welcome screen ──
  return <Redirect href="/welcome" />;
}
