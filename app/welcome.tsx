import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowRight, 
  Users, 
  DollarSign, 
  Calculator, 
  Shield,
  Smartphone,
  Star,
  Heart
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(0))[0];

  const slides = [
    {
      id: 1,
      title: 'Welcome to SplitSaathi',
      subtitle: 'Smart Expense Sharing for Nepal',
      description: 'Split bills, track expenses, and settle up with friends and family - all in one beautiful app designed for Nepali users.',
      icon: <Heart size={80} color="#4f46e5" />,
      color: '#4f46e5',
    },
    {
      id: 2,
      title: 'Create Groups Easily',
      subtitle: 'Organize Your Expenses',
      description: 'Create groups for trips, roommates, family expenses, or any shared costs. Invite members with a simple link or code.',
      icon: <Users size={80} color="#059669" />,
      color: '#059669',
    },
    {
      id: 3,
      title: 'Smart Expense Splitting',
      subtitle: 'Fair & Transparent',
      description: 'Split expenses equally or customize splits by amount, percentage, or shares. Everyone knows exactly what they owe.',
      icon: <Calculator size={80} color="#ea580c" />,
      color: '#ea580c',
    },
    {
      id: 4,
      title: 'eSewa Integration',
      subtitle: 'Seamless Payments',
      description: 'Settle up instantly with eSewa integration. Send and receive money directly through Nepal\'s most trusted digital wallet.',
      icon: <Smartphone size={80} color="#7c3aed" />,
      color: '#7c3aed',
    },
    {
      id: 5,
      title: 'Secure & Private',
      subtitle: 'Your Data is Safe',
      description: 'Bank-level security with end-to-end encryption. Your financial data is protected and never shared with third parties.',
      icon: <Shield size={80} color="#dc2626" />,
      color: '#dc2626',
    },
  ];

  useEffect(() => {
    // Initial fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Auto-advance slides
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Slide transition animation
    Animated.timing(slideAnim, {
      toValue: currentSlide,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [currentSlide]);

  const handleGetStarted = () => {
    router.replace('/(auth)/signup');
  };

  const handleSignIn = () => {
    router.replace('/(auth)/login');
  };

  const renderSlide = (slide: typeof slides[0], index: number) => (
    <View key={slide.id} style={[styles.slide, { width }]}>
      <View style={styles.slideContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${slide.color}15` }]}>
          {slide.icon}
        </View>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={[styles.slideSubtitle, { color: slide.color }]}>
          {slide.subtitle}
        </Text>
        <Text style={styles.slideDescription}>{slide.description}</Text>
      </View>
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
            { backgroundColor: currentSlide === index ? slides[currentSlide].color : '#d1d5db' }
          ]}
          onPress={() => setCurrentSlide(index)}
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
            <Text style={styles.logoEmoji}>💰</Text>
            <Text style={styles.logoText}>SplitSaathi</Text>
          </View>
          <View style={styles.madeInNepal}>
            <Text style={styles.madeInNepalText}>Made in Nepal 🇳🇵</Text>
          </View>
        </View>

        {/* Slides */}
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
        </View>

        {/* Dots Indicator */}
        {renderDots()}

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          <View style={styles.featureItem}>
            <DollarSign size={24} color="#059669" />
            <Text style={styles.featureText}>Free to Use</Text>
          </View>
          <View style={styles.featureItem}>
            <Star size={24} color="#f59e0b" />
            <Text style={styles.featureText}>Highly Rated</Text>
          </View>
          <View style={styles.featureItem}>
            <Shield size={24} color="#7c3aed" />
            <Text style={styles.featureText}>Secure</Text>
          </View>
          <View style={styles.featureItem}>
            <Smartphone size={24} color="#2563eb" />
            <Text style={styles.featureText}>eSewa Ready</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <ArrowRight size={20} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleSignIn}>
            <Text style={styles.secondaryButtonText}>Already have an account? Sign In</Text>
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
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoEmoji: {
    fontSize: 32,
    marginRight: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
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
  },
  slidesContainer: {
    height: 320,
    overflow: 'hidden',
    marginBottom: 20,
  },
  slidesWrapper: {
    flexDirection: 'row',
    height: '100%',
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  slideSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  activeDot: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  actionButtons: {
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '600',
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
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});