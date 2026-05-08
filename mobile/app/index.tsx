import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

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
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  // If user session exists, go to tabs if onboarded, else onboarding
  if (user) {
    if (onboarded) {
      return <Redirect href="/(tabs)" />;
    }
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/register" />;
}
