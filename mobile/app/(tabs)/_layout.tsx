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
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.iconWrapper}>
              <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="closet"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.iconWrapper}>
              <Ionicons name={focused ? 'shirt' : 'shirt-outline'} size={24} color={color} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="ai-stylist"
        options={{
          tabBarStyle: { display: 'none' }, // Hide tab bar on AI chat screen
          tabBarIcon: ({ focused }) => (
            <View style={[styles.centerIcon, focused && styles.centerIconActive]}>
              <Ionicons name="sparkles" size={24} color="#FFF" />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="outfits"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.iconWrapper}>
              <Ionicons name={focused ? 'layers' : 'layers-outline'} size={24} color={color} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.iconWrapper}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 90 : 70,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000',
    position: 'absolute',
    bottom: -8,
  },
  centerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 30, // Elevated floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#FFF', // Creates a cutout effect against the tab bar
  },
  centerIconActive: {
    transform: [{ scale: 1.05 }],
  },
});
