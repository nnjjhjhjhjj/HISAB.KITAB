import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ArrowRight, 
  Users, 
  DollarSign, 
  Calculator, 
  Shield,
  Smartphone,
  Star,
  Heart,
  ChevronRight
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(0))[0];
  const buttonScale = useState(new Animated.Value(1))[0];
  const [isSliding, setIsSliding] = useState(false);

  const slides = [
    {
      id: 1,
      title: 'Welcome to SplitSaathi',
      subtitle: 'Smart Expense Sharing for Nepal',
      description: 'Split bills, track expenses, and settle up with friends and family - all in one beautiful app designed for Nepali users.',
      icon: <Heart size={80} color="#ffffff" />,
      color: '#6d28d9',
      bgColor: '#8b5cf6',
    },
    {
      id: 2,
      title: 'Create Groups Easily',
      subtitle: 'Organize Your Expenses',
      description: 'Create groups for trips, roommates, family expenses, or any shared costs. Invite members with a simple link or code.',
      icon: <Users size={80} color="#ffffff" />,
      color: '#059669',
      bgColor: '#10b981',
    },
    {
      id: 3,
      title: 'Smart Expense Splitting',
      subtitle: 'Fair & Transparent',
      description: 'Split expenses equally or customize splits by amount, percentage, or shares. Everyone knows exactly what they owe.',
      icon: <Calculator size={80} color="#ffffff" />,
      color: '#ea580c',
      bgColor: '#f97316',
    },
    {
      id: 4,
      title: 'eSewa Integration',
      subtitle: 'Seamless Payments',
      description: 'Settle up instantly with eSewa integration. Send and receive money directly through Nepal\'s most trusted digital wallet.',
      icon: <Smartphone size={80} color="#ffffff" />,
      color: '#7c3aed',
      bgColor: '#8b5cf6',
    },
    {
      id: 5,
      title: 'Secure & Private',
      subtitle: 'Your Data is Safe',
      description: 'Bank-level security with end-to-end encryption. Your financial data is protected and never shared with third parties.',
      icon: <Shield size={80} color="#ffffff" />,
      color: '#dc2626',
      bgColor: '#ef4444',
    },
  ];

  useEffect(() => {
    // Initial fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Auto-advance slides
    const interval = setInterval(() => {
      if (!isSliding) {
        goToNextSlide();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isSliding]);

  useEffect(() => {
    // Slide transition animation
    Animated.spring(slideAnim, {
      toValue: currentSlide,
      friction: 20,
      tension: 70,
      useNativeDriver: true,
    }).start(() => setIsSliding(false));
  }, [currentSlide]);

  const goToNextSlide = () => {
    setIsSliding(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const goToPrevSlide = () => {
    setIsSliding(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDotPress = (index: number) => {
    if (index !== currentSlide) {
      setIsSliding(true);
      setCurrentSlide(index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleGetStarted = async () => {
    animateButton();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem('hasSeenWelcome', 'true');
    router.replace('/(auth)/signup');
  };

  const handleSignIn = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem('hasSeenWelcome', 'true');
    router.replace('/(auth)/login');
  };

  const renderSlide = (slide: typeof slides[0], index: number) => (
    <View key={slide.id} style={[styles.slide, { width }]}>
      <ImageBackground
        // source={require('../../assets/images/wave-bg.png')}
        style={[styles.slideBackground, { backgroundColor: slide.bgColor }]}
        imageStyle={styles.slideBackgroundImage}
      >
        <View style={styles.slideContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${slide.color}40` }]}>
            {slide.icon}
          </View>
          <Text style={styles.slideTitle}>{slide.title}</Text>
          <Text style={[styles.slideSubtitle, { color: '#ffffff' }]}>
            {slide.subtitle}
          </Text>
          <Text style={styles.slideDescription}>{slide.description}</Text>
        </View>
      </ImageBackground>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.dot,
            currentSlide === index && styles.activeDot,
            { backgroundColor: currentSlide === index ? slides[currentSlide].color : 'rgba(255,255,255,0.5)' }
          ]}
          onPress={() => handleDotPress(index)}
          activeOpacity={0.7}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>💸</Text>
            <Text style={styles.logoText}>SplitSaathi</Text>
          </View>
          <View style={styles.madeInNepal}>
            <Text style={styles.madeInNepalText}>Made in Nepal 🇳🇵</Text>
          </View>
        </View>

        {/* Slides with navigation arrows */}
        <View style={styles.slidesContainer}>
          <Animated.View
            style={[
              styles.slidesWrapper,
              {
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, slides.length - 1],
                      outputRange: [0, -(width * (slides.length - 1))],
                    }),
                  },
                ],
              },
            ]}
          >
            {slides.map((slide, index) => renderSlide(slide, index))}
          </Animated.View>
          
          {currentSlide > 0 && (
            <TouchableOpacity 
              style={[styles.navButton, styles.prevButton]} 
              onPress={goToPrevSlide}
              activeOpacity={0.7}
            >
              <ChevronRight size={24} color="#ffffff" style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          )}
          
          {currentSlide < slides.length - 1 && (
            <TouchableOpacity 
              style={[styles.navButton, styles.nextButton]} 
              onPress={goToNextSlide}
              activeOpacity={0.7}
            >
              <ChevronRight size={24} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Dots Indicator */}
        {renderDots()}

        {/* Features Grid */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuresContainer}
        >
          {[
            { icon: <DollarSign size={20} color="#059669" />, text: 'Free to Use' },
            { icon: <Star size={20} color="#f59e0b" />, text: 'Highly Rated' },
            { icon: <Shield size={20} color="#7c3aed" />, text: 'Secure' },
            { icon: <Smartphone size={20} color="#2563eb" />, text: 'eSewa Ready' },
            { icon: <Users size={20} color="#6d28d9" />, text: 'Group Support' },
          ].map((item, index) => (
            <View key={index} style={styles.featureItem}>
              {item.icon}
              <Text style={styles.featureText}>{item.text}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: slides[currentSlide].color }]} 
              onPress={handleGetStarted}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <ArrowRight size={20} color="#ffffff" />
            </TouchableOpacity>
          </Animated.View>
          
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleSignIn}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryButtonText, { color: slides[currentSlide].color }]}>
              Already have an account? Sign In
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Join thousands of Nepali users who trust SplitSaathi
          </Text>
          <Text style={styles.footerSubtext}>
            Available on Web • iOS • Android
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 28,
    marginRight: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'Inter_700Bold',
  },
  madeInNepal: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  madeInNepalText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  slidesContainer: {
    height: height * 0.45,
    overflow: 'hidden',
    marginBottom: 16,
    borderRadius: 24,
    position: 'relative',
  },
  slideBackground: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  slideBackgroundImage: {
    opacity: 0.15,
    resizeMode: 'cover',
  },
  slidesWrapper: {
    flexDirection: 'row',
    height: '100%',
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 300,
    padding: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter_800ExtraBold',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  slideSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter_600SemiBold',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  slideDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  prevButton: {
    left: 16,
    transform: [{ translateY: -22 }],
  },
  nextButton: {
    right: 16,
    transform: [{ translateY: -22 }],
  },
  featuresContainer: {
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  actionButtons: {
    marginBottom: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'Inter_500Medium',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
});