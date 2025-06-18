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
      // On error, redirect to login
      router.replace('/(auth)/login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.text}>Loading SplitSaathi...</Text>
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
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
});