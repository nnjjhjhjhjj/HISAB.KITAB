import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Group, Expense, User, ApiResponse } from '@/types';
import { GoogleUser } from './googleAuth';

// API Configuration - Use environment variable or fallback
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://splitsaathi.up.railway.app';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth token storage
let authToken: string | null = null;

// Initialize auth token from storage
const initializeAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      authToken = token;
    }
  } catch (error) {
    console.error('Error loading auth token:', error);
  }
};

// Initialize on module load
initializeAuthToken();

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    console.log(`Making API request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API response from ${response.config.url}:`, response.status);
    return response;
  },
  async (error) => {
    console.error('API Error:', error.response?.data || error.message);
    console.error('API Error Status:', error.response?.status);
    console.error('API Error URL:', error.config?.url);
    
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      authToken = null;
      await AsyncStorage.removeItem('authToken');
      // In a real app, you might want to redirect to login here
    }
    
    return Promise.reject(error);
  }
);

// API Service Functions
export const apiService = {
  // Authentication
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    try {
      console.log('Attempting login with:', { email });
      const response = await api.post('/users/login', { email, password });
      console.log('Login response:', response.data);
      
      const { token, user } = response.data;
      authToken = token;
      await AsyncStorage.setItem('authToken', token);
      return { token, user };
    } catch (error) {
      console.error('Login API call failed:', error);
      if (typeof error === 'object' && error !== null && 'response' in error && typeof (error as any).response === 'object') {
        throw new Error((error as any).response?.data?.message || 'Login failed');
      }
      throw new Error('Login failed');
    }
  },

  async register(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
    try {
      console.log('Attempting registration with:', { name, email });
      const response = await api.post('/users/register', { name, email, password });
      console.log('Registration response:', response.data);
      
      const { token, user } = response.data;
      authToken = token;
      await AsyncStorage.setItem('authToken', token);
      return { token, user };
    } catch (error) {
      console.error('Registration API call failed:', error);
      if (typeof error === 'object' && error !== null && 'response' in error && typeof (error as any).response === 'object') {
        throw new Error((error as any).response?.data?.message || 'Registration failed');
      }
      throw new Error('Registration failed');
    }
  },

  // Google Authentication
  async loginWithGoogle(googleUser: GoogleUser): Promise<{ token: string; user: User }> {
    try {
      console.log('Attempting Google login with:', { email: googleUser.email });
      const response = await api.post('/users/google-login', {
        googleId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      });
      console.log('Google login response:', response.data);
      
      const { token, user } = response.data;
      authToken = token;
      await AsyncStorage.setItem('authToken', token);
      return { token, user };
    } catch (error) {
      console.error('Google login API call failed:', error);
      if (typeof error === 'object' && error !== null && 'response' in error && typeof (error as any).response === 'object') {
        throw new Error((error as any).response?.data?.message || 'Google login failed');
      }
      throw new Error('Google login failed');
    }
  },

  async registerWithGoogle(googleUser: GoogleUser): Promise<{ token: string; user: User }> {
    try {
      console.log('Attempting Google registration with:', { email: googleUser.email });
      const response = await api.post('/users/google-register', {
        googleId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      });
      console.log('Google registration response:', response.data);
      
      const { token, user } = response.data;
      authToken = token;
      await AsyncStorage.setItem('authToken', token);
      return { token, user };
    } catch (error) {
      console.error('Google registration API call failed:', error);
      if (typeof error === 'object' && error !== null && 'response' in error && typeof (error as any).response === 'object') {
        throw new Error((error as any).response?.data?.message || 'Google registration failed');
      }
      throw new Error('Google registration failed');
    }
  },

  // Get user profile
  async getUserProfile(): Promise<User> {
    try {
      console.log('Fetching user profile...');
      const response = await api.get('/users/profile');
      console.log('Profile response:', response.data);
      
      return response.data.user;
    } catch (error) {
      console.error('Get profile API call failed:', error);
      throw error;
    }
  },

  // Set auth token (for when user logs in)
  async setAuthToken(token: string) {
    authToken = token;
    await AsyncStorage.setItem('authToken', token);
    console.log('Auth token set and stored');
  },

  // Clear auth token (for logout)
  async clearAuthToken() {
    authToken = null;
    await AsyncStorage.removeItem('authToken');
    console.log('Auth token cleared and removed from storage');
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!authToken;
  },

  // Groups
  async getGroups(): Promise<Group[]> {
    try {
      console.log('Fetching groups...');
      const response = await api.get('/api/groups');
      console.log('Groups response:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('Groups API call failed:', error);
      throw error;
    }
  },

  async getGroup(id: string): Promise<Group | null> {
    try {
      console.log('Fetching group:', id);
      const response = await api.get(`/api/groups/${id}`);
      console.log('Group response:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('Group API call failed:', error);
      throw error;
    }
  },

  async createGroup(group: Omit<Group, 'id' | 'createdAt' | 'totalExpenses' | 'balances'>): Promise<Group> {
    try {
      console.log('Creating group:', group);
      const response = await api.post('/api/groups', group);
      console.log('Create group response:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('Create group API call failed:', error);
      if (typeof error === 'object' && error !== null && 'response' in error && typeof (error as any).response === 'object') {
        throw new Error((error as any).response?.data?.message || 'Failed to create group');
      }
      throw new Error('Failed to create group');
    }
  },

  async joinGroupById(groupId: string): Promise<Group> {
    try {
      console.log('Joining group by ID:', groupId);
      const response = await api.post(`/api/groups/${groupId}/join`);
      console.log('Join group response:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('Join group API call failed:', error);
      if (typeof error === 'object' && error !== null && 'response' in error && typeof (error as any).response === 'object') {
        throw new Error((error as any).response?.data?.message || 'Failed to join group');
      }
      throw new Error('Failed to join group');
    }
  },

  // Expenses
  async getGroupExpenses(groupId: string): Promise<Expense[]> {
    try {
      console.log('Fetching expenses for group:', groupId);
      const response = await api.get(`/api/expenses/group/${groupId}`);
      console.log('Expenses response:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('Expenses API call failed:', error);
      throw error;
    }
  },

  async getAllExpenses(): Promise<Expense[]> {
    try {
      console.log('Fetching all expenses...');
      const response = await api.get('/api/expenses');
      console.log('All expenses response:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('Get all expenses API call failed:', error);
      throw error;
    }
  },

  async createExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    try {
      console.log('Creating expense:', expense);
      const response = await api.post('/api/expenses', expense);
      console.log('Create expense response:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('Create expense API call failed:', error);
      if (typeof error === 'object' && error !== null && 'response' in error && typeof (error as any).response === 'object') {
        throw new Error((error as any).response?.data?.message || 'Failed to create expense');
      }
      throw new Error('Failed to create expense');
    }
  },

  async createUnequalExpense(expense: {
    groupId: string;
    description: string;
    amount: number;
    paidBy: string;
    splits: { participant: string; amount: number; percentage?: number }[];
    date: string;
  }): Promise<Expense> {
    try {
      console.log('Creating unequal expense:', expense);
      const response = await api.post('/api/expenses/unequal', expense);
      console.log('Create unequal expense response:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('Create unequal expense API call failed:', error);
      if (typeof error === 'object' && error !== null && 'response' in error && typeof (error as any).response === 'object') {
        throw new Error((error as any).response?.data?.message || 'Failed to create unequal expense');
      }
      throw new Error('Failed to create unequal expense');
    }
  },
};