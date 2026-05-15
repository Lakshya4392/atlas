import React, { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="closet" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="ai-stylist" options={{ tabBarItemStyle: { display: 'none' } }} />
      <Tabs.Screen name="outfits" options={{ tabBarItemStyle: { display: 'none' } }} />
    </Tabs>
  );
}

function AnimatedTab({ isFocused, iconName, label, onPress }: any) {
  const animatedValue = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused ? 1 : 0,
      duration: 350,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(234, 234, 234, 0)', '#E8E8E8']
  });

  const iconMaxWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0] // 24 when inactive, 0 when active
  });

  const iconOpacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0]
  });

  const textOpacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1]
  });

  const textMaxWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 80] // Safer width for smaller screens
  });

  const paddingHorizontal = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 20] // Tighter dynamic padding
  });

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.tabButton}
    >
      <Animated.View style={[styles.animatedTabItem, { backgroundColor, paddingHorizontal }]}>
        
        {/* Icon Container (Visible when inactive) */}
        <Animated.View style={{ maxWidth: iconMaxWidth, opacity: iconOpacity, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={iconName} size={20} color="#666" />
        </Animated.View>

        {/* Text Container (Visible when active) */}
        <Animated.View style={{ maxWidth: textMaxWidth, opacity: textOpacity, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={styles.activeLabel} numberOfLines={1}>{label}</Text>
        </Animated.View>

      </Animated.View>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const activeRouteName = state.routes[state.index].name;

  // Hide the dock completely when inside the AI Stylist chat interface
  if (activeRouteName === 'ai-stylist') {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* ── Glassmorphism Dock ── */}
      <BlurView intensity={70} tint="light" style={styles.dock}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          
          if (options.tabBarItemStyle?.display === 'none') {
            return null;
          }

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          let iconName: any = 'help';
          let label = '';
          
          if (route.name === 'index') {
            iconName = 'home';
            label = 'Home';
          } else if (route.name === 'closet') {
            iconName = 'shirt';
            label = 'Closet';
          } else if (route.name === 'profile') {
            iconName = 'person';
            label = 'Profile';
          }

          return (
            <AnimatedTab 
              key={route.key}
              isFocused={isFocused}
              iconName={iconName}
              label={label}
              onPress={onPress}
            />
          );
        })}
      </BlurView>

      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ai-stylist')}
      >
        <Ionicons name="color-wand" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Highly transparent white for true Glassmorphism effect
    backgroundColor: 'rgba(255, 255, 255, 0.45)', 
    height: 58, 
    borderRadius: 29, 
    paddingHorizontal: 8,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  fab: {
    width: 58, 
    height: 58, 
    borderRadius: 29, 
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tabButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  animatedTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48, 
    borderRadius: 24,
  },
  activeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
});
