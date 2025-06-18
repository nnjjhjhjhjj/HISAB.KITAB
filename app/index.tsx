import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '@/services/api';

export default function IndexScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if this is the first time opening the app
      const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
      
      if (!hasSeenWelcome) {
        // First time user - show welcome screen
        router.replace('/welcome');
        return;
      }

      // Check if user has a stored auth token
      const token = await AsyncStorage.getItem('authToken');
      
      if (token) {
        // Set the token in the API service
        apiService.setAuthToken(token);
        
        // Verify the token is still valid by trying to get user profile
        try {
          await apiService.getUserProfile();
          // Token is valid, redirect to main app
          router.replace('/(tabs)');
          return;
        } catch (error) {
          // Token is invalid, clear it
          await AsyncStorage.removeItem('authToken');
          apiService.clearAuthToken();
        }
      }
      
      // No valid token, redirect to login
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error checking auth status:', error);
      // On error, redirect to welcome screen for safety
      router.replace('/welcome');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>💰</Text>
          <Text style={styles.logoText}>SplitSaathi</Text>
        </View>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.text}>Loading SplitSaathi...</Text>
        <Text style={styles.subtext}>Made with ❤️ in Nepal 🇳🇵</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoEmoji: {
    fontSize: 48,
    marginRight: 12,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  subtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
  },
});