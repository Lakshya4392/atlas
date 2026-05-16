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
    image: require('../assets/images/welcome_snap.png'),
    title: 'Snap Yourself',
    subtitle: 'Upload a clear photo to start your\nstyle journey.',
    button: 'Next',
  },
  {
    id: 2,
    image: require('../assets/images/welcome_closet.png'),
    title: 'Add Your Closet',
    subtitle: 'Upload photos of clothes you want\nto try on.',
    button: 'Next',
  },
  {
    id: 3,
    image: require('../assets/images/welcome_tryon.png'),
    title: 'Try It On',
    subtitle: 'Instantly see how each outfit looks\non you.',
    button: 'Continue',
  },
];

export default function WelcomeScreen() {
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Entrance animation
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, damping: 20, stiffness: 120, delay: 200, useNativeDriver: true }),
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

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      scrollViewRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
    } else {
      router.push('/login');
    }
  };

  const handleSkip = () => {
    router.push('/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      <Animated.View style={[styles.content, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
        
        {/* ── Image Carousel ── */}
        <View style={styles.imageCardWrapper}>
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
            {SLIDES.map((slide, index) => (
              <View key={slide.id} style={styles.slideContainer}>
                <View style={styles.imageCard}>
                  <Image
                    source={slide.image}
                    style={styles.slideImage}
                    resizeMode="cover"
                  />
                </View>
              </View>
            ))}
          </Animated.ScrollView>
        </View>

        {/* ── Text + Controls ── */}
        <View style={styles.bottomSection}>
          
          {/* Page Dots */}
          <View style={styles.dotsContainer}>
            {SLIDES.map((_, index) => {
              const dotWidth = scrollX.interpolate({
                inputRange: [(index - 1) * width, index * width, (index + 1) * width],
                outputRange: [6, 24, 6],
                extrapolate: 'clamp',
              });
              const dotOpacity = scrollX.interpolate({
                inputRange: [(index - 1) * width, index * width, (index + 1) * width],
                outputRange: [0.25, 1, 0.25],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View
                  key={index}
                  style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]}
                />
              );
            })}
          </View>

          {/* Title */}
          <Text style={styles.title}>{SLIDES[currentIndex].title}</Text>
          
          {/* Subtitle */}
          <Text style={styles.subtitle}>{SLIDES[currentIndex].subtitle}</Text>

          {/* Primary Button */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              {SLIDES[currentIndex].button}
            </Text>
          </TouchableOpacity>

          {/* Skip */}
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.6}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>

      {/* iOS-style bottom pill indicator */}
      <View style={styles.homeIndicator}>
        <View style={styles.homeIndicatorPill} />
      </View>
    </SafeAreaView>
  );
}

const IMAGE_CARD_HEIGHT = height * 0.48;
const CARD_MARGIN = 24;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },

  // ── Image Carousel ──
  imageCardWrapper: {
    height: IMAGE_CARD_HEIGHT + 20,
    paddingTop: 10,
  },
  slideContainer: {
    width: width,
    paddingHorizontal: CARD_MARGIN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCard: {
    width: width - CARD_MARGIN * 2,
    height: IMAGE_CARD_HEIGHT,
    borderRadius: 28,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },

  // ── Bottom Text + Controls ──
  bottomSection: {
    flex: 1,
    paddingHorizontal: CARD_MARGIN + 8,
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 16 : 24,
  },

  // Dots
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 28,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000',
  },

  // Title
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },

  // Subtitle
  subtitle: {
    fontSize: 15,
    color: '#999',
    lineHeight: 22,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 32,
  },

  // Primary CTA
  primaryBtn: {
    width: '100%',
    backgroundColor: '#000',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Skip
  skipBtn: {
    alignSelf: 'center',
    paddingVertical: 14,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },

  // Home indicator pill
  homeIndicator: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  homeIndicatorPill: {
    width: 134,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#000',
    opacity: 0.15,
  },
});
