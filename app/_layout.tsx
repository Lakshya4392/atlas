import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../src/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="item-detail" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="outfit-detail" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="add-item" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="wishlist" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="inspo" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="trip-planner" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="calendar-log" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
