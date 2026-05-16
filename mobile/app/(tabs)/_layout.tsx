import React, { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="closet" />
      <Tabs.Screen name="ai-stylist" options={{ tabBarItemStyle: { display: 'none' } }} />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="outfits" options={{ tabBarItemStyle: { display: 'none' } }} />
    </Tabs>
  );
}

function AnimatedTab({ isFocused, iconName, onPress }: any) {
  const anim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isFocused ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const bg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0)', 'rgba(255,255,255,1)'],
  });

  const activeOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const inactiveOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  const iconToUse = `${iconName}-outline`;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.tabBtn}
    >
      <Animated.View style={[styles.tabCircle, { backgroundColor: bg }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', opacity: inactiveOpacity }]}>
          <Ionicons name={iconToUse as any} size={22} color="#999" />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', opacity: activeOpacity }]}>
          <Ionicons name={iconToUse as any} size={22} color="#111" />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const active = state.routes[state.index].name;
  if (active === 'ai-stylist') return null;

  return (
    <View style={styles.barWrap}>
      {/* ── Main Dock (3 Items) ── */}
      <View style={styles.dock}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          if (options.tabBarItemStyle?.display === 'none') return null;

          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };

          let iconBase: any = 'help';
          if (route.name === 'index') iconBase = 'home';
          else if (route.name === 'closet') iconBase = 'shirt';
          else if (route.name === 'profile') iconBase = 'person';

          return (
            <AnimatedTab key={route.key} isFocused={focused} iconName={iconBase} onPress={onPress} />
          );
        })}
      </View>

      {/* ── Separate AI FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('ai-stylist')}
      >
        <Ionicons name="sparkles" size={26} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28, // Wider gap for premium feel
    backgroundColor: '#121212',
    height: 58, // Taller pill
    borderRadius: 29,
    paddingHorizontal: 8, // 8px padding gives a beautiful even ring around the active circle
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#262626', // Subtle glass edge
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 12,
  },
  fab: {
    width: 58, 
    height: 58,
    borderRadius: 29,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#262626',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 12,
  },
  tabBtn: {
    width: 46, // Circle touch area
    height: 46,
    borderRadius: 23,
    alignItems: 'center', 
    justifyContent: 'center', 
  },
  tabCircle: {
    width: 46, 
    height: 46, 
    borderRadius: 23,
    alignItems: 'center', 
    justifyContent: 'center',
  },
});
