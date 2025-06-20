import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Switch,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  CircleHelp as HelpCircle, 
  LogOut, 
  ChevronRight, 
  Mail, 
  Phone, 
  CreditCard as Edit3, 
  DollarSign, 
  Users, 
  Receipt, 
  Star, 
  Camera, 
  Moon, 
  Globe, 
  CreditCard, 
  Download, 
  Share2,
  Trash2,
  Lock,
  Eye,
  Gift,
  Award,
  TrendingUp,
  Calendar,
  Smartphone,
  Heart
} from 'lucide-react-native';
import { apiService } from '@/services/api';
import { User as UserType } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalExpenses: 0,
    totalTransactions: 0,
    monthlySpending: 0,
    averageExpense: 0,
    mostActiveGroup: '',
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [userProfile, groups, expenses] = await Promise.all([
        apiService.getUserProfile(),
        apiService.getGroups(),
        apiService.getAllExpenses(),
      ]);

      setUser(userProfile);
      
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.createdAt);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      });
      
      const monthlySpending = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;
      
      // Find most active group
      const groupExpenseCounts = groups.map(group => ({
        name: group.name,
        count: expenses.filter(expense => expense.groupId === group.id).length
      }));
      const mostActiveGroup = groupExpenseCounts.reduce((prev, current) => 
        prev.count > current.count ? prev : current, { name: 'None', count: 0 }
      );

      setStats({
        totalGroups: groups.length,
        totalExpenses: totalExpenses,
        totalTransactions: expenses.length,
        monthlySpending,
        averageExpense,
        mostActiveGroup: mostActiveGroup.name,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            apiService.clearAuthToken();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/profile/edit');
  };

  const handleChangePassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/profile/change-password');
  };

  const handleNotificationSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/profile/notifications');
  };

  const handlePrivacySettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/profile/privacy');
  };

  const handleHelp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/profile/help');
  };

  const handleAbout = () => {
    router.push('/profile/about');
  };

  const handleExportData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/profile/export-data');
  };

  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/profile/delete-account');
  };

  const handleShareApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: 'Check out SplitSaathi - the best app for splitting expenses with friends! Download it now: https://splitsaathi.up.railway.app',
        title: 'Share SplitSaathi'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share app');
    }
  };

  const handleRateApp = () => {
    Alert.alert(
      'Rate SplitSaathi',
      'Thank you for using SplitSaathi! Would you like to rate us on the app store?',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Rate Now', onPress: () => Alert.alert('Thank you!', 'This would open the app store rating page.') }
      ]
    );
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightElement?: React.ReactNode,
    showChevron: boolean = true,
    danger: boolean = false
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingIcon, danger && styles.dangerIcon]}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.dangerText]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (showChevron && onPress && (
        <ChevronRight size={20} color="#9ca3af" />
      ))}
    </TouchableOpacity>
  );

  const renderStatsCard = (icon: React.ReactNode, label: string, value: string | number, color: string = '#2563eb') => (
    <View style={styles.statsCard}>
      <View style={[styles.statsIcon, { backgroundColor: `${color}20` }]}>
        {React.cloneElement(icon as React.ReactElement, { color })}
      </View>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsLabel}>{label}</Text>
    </View>
  );

  const renderQuickAction = (icon: React.ReactNode, title: string, subtitle: string, onPress: () => void, color: string = '#2563eb') => (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}20` }]}>
        {React.cloneElement(icon as React.ReactElement, { color })}
      </View>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={16} color="#9ca3af" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient colors={["#6366f1", "#a5b4fc"]} style={styles.heroHeader}>
          <View style={styles.heroContent}>
            <Image
              source={{ uri: user?.picture || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' }}
              style={styles.avatar}
            />
            <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
        </LinearGradient>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsCard}>
            <Users size={20} color="#6366f1" />
            <Text style={styles.statsValue}>{stats.totalGroups}</Text>
            <Text style={styles.statsLabel}>Groups</Text>
          </View>
          <View style={styles.statsCard}>
            <DollarSign size={20} color="#059669" />
            <Text style={styles.statsValue}>${stats.totalExpenses.toFixed(0)}</Text>
            <Text style={styles.statsLabel}>Total Spent</Text>
          </View>
          <View style={styles.statsCard}>
            <Receipt size={20} color="#ea580c" />
            <Text style={styles.statsValue}>{stats.totalTransactions}</Text>
            <Text style={styles.statsLabel}>Transactions</Text>
          </View>
          <View style={styles.statsCard}>
            <Star size={20} color="#f59e0b" />
            <Text style={styles.statsValue}>${stats.monthlySpending.toFixed(0)}</Text>
            <Text style={styles.statsLabel}>This Month</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <TouchableOpacity style={styles.quickActionCard} onPress={handleEditProfile}>
            <Edit3 size={20} color="#6366f1" />
            <Text style={styles.quickActionText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={handleExportData}>
            <Download size={20} color="#059669" />
            <Text style={styles.quickActionText}>Export Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={handleShareApp}>
            <Share2 size={20} color="#7c3aed" />
            <Text style={styles.quickActionText}>Share App</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={handleHelp}>
            <HelpCircle size={20} color="#2563eb" />
            <Text style={styles.quickActionText}>Help & Support</Text>
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={styles.settingsSection}>
          <TouchableOpacity style={styles.settingItem} onPress={handleNotificationSettings}>
            <Bell size={20} color="#6366f1" />
            <Text style={styles.settingText}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#f3f4f6', true: '#bfdbfe' }}
              thumbColor={notificationsEnabled ? '#6366f1' : '#9ca3af'}
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={() => setDarkModeEnabled(!darkModeEnabled)}>
            <Moon size={20} color="#6366f1" />
            <Text style={styles.settingText}>Dark Mode</Text>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#f3f4f6', true: '#bfdbfe' }}
              thumbColor={darkModeEnabled ? '#6366f1' : '#9ca3af'}
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacySettings}>
            <Shield size={20} color="#6366f1" />
            <Text style={styles.settingText}>Privacy</Text>
            <ChevronRight size={20} color="#9ca3af" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={handleChangePassword}>
            <Lock size={20} color="#6366f1" />
            <Text style={styles.settingText}>Change Password</Text>
            <ChevronRight size={20} color="#9ca3af" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZoneSection}>
          <TouchableOpacity style={styles.dangerItem} onPress={handleDeleteAccount}>
            <Trash2 size={20} color="#dc2626" />
            <Text style={styles.dangerText}>Delete Account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerItem} onPress={handleLogout}>
            <LogOut size={20} color="#dc2626" />
            <Text style={styles.dangerText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>SplitSaathi v1.0.0</Text>
          <Text style={styles.versionSubtext}>Made with ❤️ in Nepal 🇳🇵</Text>
          <Text style={styles.versionSubtext}>© 2024 SplitSaathi. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  heroHeader: {
    minHeight: 180,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 36,
    paddingBottom: 24,
  },
  heroContent: { alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12, borderWidth: 2, borderColor: '#fff' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  userEmail: { fontSize: 15, color: '#e0e7ff' },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: -32,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 2,
  },
  statsCard: { alignItems: 'center', flex: 1 },
  statsValue: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 4 },
  statsLabel: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  quickActionsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
    gap: 12,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flex: 1,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionText: { marginLeft: 12, fontSize: 15, fontWeight: '600', color: '#374151' },
  settingsSection: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingText: { marginLeft: 12, fontSize: 15, color: '#374151', fontWeight: '500', flex: 1 },
  dangerZoneSection: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 24,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dangerText: { marginLeft: 12, fontSize: 15, color: '#dc2626', fontWeight: '600', flex: 1 },
  versionContainer: { alignItems: 'center', paddingVertical: 20, paddingBottom: 40 },
  versionText: { fontSize: 14, color: '#9ca3af', marginBottom: 4 },
  versionSubtext: { fontSize: 12, color: '#d1d5db', marginBottom: 2 },
});