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
  Image,
  Platform,
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
  ChevronRight,
  ArrowLeft
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const isAndroid = Platform.OS === 'android';

export default function WelcomeScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(0))[0];
  const buttonScale = useState(new Animated.Value(1))[0];
  const [isSliding, setIsSliding] = useState(false);

  const slides = [
    {
      id: 1,
      title: 'Smart Expense Sharing',
      subtitle: 'For Nepal',
      description: 'Split bills, track expenses, and settle up with friends and family - all in one beautiful app designed for Nepali users.',
      icon: <Heart size={64} color="#ffffff" />,
      color: '#7c3aed',
      gradient: ['#7c3aed', '#6d28d9'],
      // image: require('../../assets/images/welcome-1.png'),
    },
    {
      id: 2,
      title: 'Create Groups',
      subtitle: 'Organize Expenses',
      description: 'Create groups for trips, roommates, or family expenses. Invite members with a simple link or QR code.',
      icon: <Users size={64} color="#ffffff" />,
      color: '#10b981',
      gradient: ['#10b981', '#059669'],
      // image: require('../../assets/images/welcome-2.png'),
    },
    {
      id: 3,
      title: 'Fair Splits',
      subtitle: 'Smart Calculations',
      description: 'Split expenses equally or customize by amount, percentage. Automatic calculations show who owes what.',
      icon: <Calculator size={64} color="#ffffff" />,
      color: '#f97316',
      gradient: ['#f97316', '#ea580c'],
      // image: require('../../assets/images/welcome-3.png'),
    },
    {
      id: 4,
      title: 'Digital Payments',
      subtitle: 'eSewa & Khalti',
      description: 'Settle up instantly with Nepal\'s top payment platforms through trusted digital wallets.',
      icon: <Smartphone size={64} color="#ffffff" />,
      color: '#2563eb',
      gradient: ['#2563eb', '#1d4ed8'],
      // image: require('../../assets/images/welcome-4.png'),
    },
    {
      id: 5,
      title: 'Bank-Level',
      subtitle: 'Security',
      description: 'End-to-end encryption keeps your financial data safe. We never share your information.',
      icon: <Shield size={64} color="#ffffff" />,
      color: '#dc2626',
      gradient: ['#dc2626', '#b91c1c'],
      // image: require('../../assets/images/welcome-5.png'),
    },
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    const interval = setInterval(() => {
      if (!isSliding) {
        goToNextSlide();
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [isSliding]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: currentSlide,
      friction: 15,
      tension: 60,
      useNativeDriver: true,
    }).start(() => setIsSliding(false));
  }, [currentSlide]);

  const goToNextSlide = () => {
    if (isSliding) return;
    setIsSliding(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const goToPrevSlide = () => {
    if (isSliding) return;
    setIsSliding(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDotPress = (index: number) => {
    if (index !== currentSlide && !isSliding) {
      setIsSliding(true);
      setCurrentSlide(index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1.05,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 60,
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
      <LinearGradient
        colors={slide.gradient}
        style={styles.slideBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.slideContent}>
          <View style={styles.textContent}>
            <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideDescription}>{slide.description}</Text>
          </View>
          
          <View style={styles.imageContainer}>
            <Image 
              source={slide.image} 
              style={styles.slideImage}
              resizeMode="contain"
            />
            <View style={[styles.iconContainer, { backgroundColor: `${slide.color}40` }]}>
              {slide.icon}
            </View>
          </View>
        </View>
      </LinearGradient>
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
            <View style={[styles.logoCircle, { backgroundColor: slides[currentSlide].color }]}>
              <Text style={styles.logoEmoji}>💸</Text>
            </View>
            <Text style={styles.logoText}>SplitSaathi</Text>
          </View>
          <View style={[styles.madeInNepal, { backgroundColor: `${slides[currentSlide].color}15` }]}>
            <Text style={[styles.madeInNepalText, { color: slides[currentSlide].color }]}>
              Made in Nepal 🇳🇵
            </Text>
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
          
          <TouchableOpacity 
            style={[styles.navButton, styles.prevButton]} 
            onPress={goToPrevSlide}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navButton, styles.nextButton]} 
            onPress={goToNextSlide}
            activeOpacity={0.7}
          >
            <ArrowRight size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Dots Indicator */}
        {renderDots()}

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          {[
            { icon: <DollarSign size={20} color={slides[currentSlide].color} />, text: 'Free' },
            { icon: <Star size={20} color={slides[currentSlide].color} />, text: '4.9' },
            { icon: <Shield size={20} color={slides[currentSlide].color} />, text: 'Secure' },
            { icon: <Smartphone size={20} color={slides[currentSlide].color} />, text: 'Payments' },
            { icon: <Users size={20} color={slides[currentSlide].color} />, text: 'Groups' },
          ].map((item, index) => (
            <View 
              key={index} 
              style={[
                styles.featureItem,
                { backgroundColor: `${slides[currentSlide].color}10` }
              ]}
            >
              {item.icon}
              <Text style={[styles.featureText, { color: slides[currentSlide].color }]}>
                {item.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity 
              style={[
                styles.primaryButton, 
                { 
                  backgroundColor: slides[currentSlide].color,
                  shadowColor: slides[currentSlide].color,
                }
              ]} 
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
          <Text style={[styles.footerText, { color: slides[currentSlide].color }]}>
            Join thousands of Nepali users
          </Text>
          <Text style={styles.footerSubtext}>
            Available on Web, iOS & Android
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
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: isAndroid ? 10 : 24,
    paddingBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoEmoji: {
    fontSize: 22,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  madeInNepal: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  madeInNepalText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  slidesContainer: {
    height: height * 0.50,
    overflow: 'hidden',
    marginBottom: 16,
    borderRadius: 24,
    position: 'relative',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  slideBackground: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContent: {
    flex: 1,
    paddingRight: 16,
  },
  imageContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    fontFamily: 'Inter_800ExtraBold',
    lineHeight: 32,
  },
  slideSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  slideDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
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
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  prevButton: {
    left: 16,
    transform: [{ translateY: -24 }],
  },
  nextButton: {
    right: 16,
    transform: [{ translateY: -24 }],
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  featureItem: {
    flex: 1,
    minWidth: 60,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
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
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: isAndroid ? 10 : 20,
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: 'Inter_600SemiBold',
  },
  footerSubtext: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
});