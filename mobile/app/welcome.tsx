import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  StatusBar, Image, Animated, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    image: require('../assets/images/welcome_bg.png'),
    title: 'Change your\nPerspective In Style',
    subtitle: 'Experience AI-powered wardrobe management and elevate your daily appearance.',
  },
  {
    id: 2,
    image: require('../assets/images/welcome_carousel_2.png'),
    title: 'Virtual\nTry-On Magic',
    subtitle: 'See how any outfit looks on you instantly before deciding what to wear.',
  },
  {
    id: 3,
    image: require('../assets/images/welcome_carousel_3.png'),
    title: 'Your Premium\nDigital Closet',
    subtitle: 'Organize, plan, and discover perfect combinations from your own wardrobe.',
  },
];

export default function WelcomeScreen() {
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideUp = useRef(new Animated.Value(60)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 800, delay: 400, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, damping: 20, stiffness: 100, delay: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onMomentumScrollEnd = (e: any) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(newIndex);
  };

  const handlePress = () => {
    if (currentIndex < SLIDES.length - 1) {
      // Go to next slide
      scrollViewRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
    } else {
      // Go to login on last slide
      router.push('/login');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Background Carousel ── */}
      <View style={styles.carouselContainer}>
        <Animated.ScrollView
          ref={scrollViewRef as any}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumScrollEnd}
        >
          {SLIDES.map((slide, index) => {
            // Slight parallax effect for background
            const translateX = scrollX.interpolate({
              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
              outputRange: [-width * 0.2, 0, width * 0.2],
              extrapolate: 'clamp',
            });

            return (
              <View key={slide.id} style={styles.slide}>
                <Animated.Image
                  source={slide.image}
                  style={[styles.heroImage, { transform: [{ translateX }] }]}
                  resizeMode="cover"
                />
              </View>
            );
          })}
        </Animated.ScrollView>
        <View style={styles.overlay} />
      </View>

      {/* ── Bottom Sheet Card ── */}
      <Animated.View style={[styles.bottomCard, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
        
        {/* Progress Dashes */}
        <View style={styles.dashContainer}>
          {SLIDES.map((_, index) => {
            const isActive = currentIndex === index;
            return (
              <View
                key={index}
                style={[styles.dash, isActive && styles.dashActive]}
              />
            );
          })}
        </View>

        <Text style={styles.title}>{SLIDES[currentIndex].title}</Text>
        <Text style={styles.subtitle}>{SLIDES[currentIndex].subtitle}</Text>

        {/* ── Continue Button ── */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handlePress}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
        </TouchableOpacity>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  carouselContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.75,
  },
  slide: {
    width: width,
    height: height * 0.75,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 32,
    paddingTop: 36,
    paddingBottom: Platform.OS === 'ios' ? 48 : 36,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 20,
  },
  dashContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  dash: {
    width: 24,
    height: 3,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
  },
  dashActive: {
    width: 36,
    height: 3,
    backgroundColor: '#000',
    borderRadius: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    lineHeight: 36,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
    minHeight: 72, // Reserve space for 2 lines so button doesn't jump
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    lineHeight: 22,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 40,
    minHeight: 44, // Reserve space
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#000',
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
});
