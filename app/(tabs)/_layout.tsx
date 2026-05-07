import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '../../constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
      }}
    >
      {/* Home — "AD" brand logo */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.brandTab}>
              <Text style={[styles.brandTabText, focused && styles.brandTabTextActive]}>AD</Text>
            </View>
          ),
        }}
      />

      {/* Closet — shirt */}
      <Tabs.Screen
        name="closet"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.iconWrap}>
              <Ionicons
                name={focused ? 'shirt' : 'shirt-outline'}
                size={22}
                color={focused ? Colors.accent : color}
              />
            </View>
          ),
        }}
      />

      {/* AI Stylist — center sparkle */}
      <Tabs.Screen
        name="ai-stylist"
        options={{
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ focused }) => (
            <View style={[styles.centerIcon, focused && styles.centerIconActive]}>
              <Ionicons name="sparkles" size={18} color={focused ? '#fff' : Colors.textMuted} />
            </View>
          ),
        }}
      />

      {/* Outfits — layers */}
      <Tabs.Screen
        name="outfits"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.iconWrap}>
              <Ionicons
                name={focused ? 'layers' : 'layers-outline'}
                size={22}
                color={focused ? Colors.accent : color}
              />
            </View>
          ),
        }}
      />

      {/* Profile — person */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.iconWrap}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={22}
                color={focused ? Colors.accent : color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    height: Platform.OS === 'ios' ? 92 : 72,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 10,
    ...Shadows.lg,
  },
  brandTab: {
    paddingHorizontal: 4,
  },
  brandTabText: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.black,
    color: Colors.textMuted,
    letterSpacing: 3,
  },
  brandTabTextActive: {
    color: Colors.accent,
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  centerIconActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    ...Shadows.md,
  },
});
