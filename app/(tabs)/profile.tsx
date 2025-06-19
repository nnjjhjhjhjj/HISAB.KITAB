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
    router.push('/profile/edit');
  };

  const handleChangePassword = () => {
    router.push('/profile/change-password');
  };

  const handleNotificationSettings = () => {
    router.push('/profile/notifications');
  };

  const handlePrivacySettings = () => {
    router.push('/profile/privacy');
  };

  const handleAppSettings = () => {
    router.push('/profile/settings');
  };

  const handleHelp = () => {
    router.push('/profile/help');
  };

  const handleAbout = () => {
    router.push('/profile/about');
  };

  const handleExportData = () => {
    router.push('/profile/export-data');
  };

  const handleDeleteAccount = () => {
    router.push('/profile/delete-account');
  };

  const handleShareApp = async () => {
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Edit3 size={20} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: user?.picture || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' }} 
              style={styles.avatar} 
            />
            <TouchableOpacity style={styles.cameraButton}>
              <Camera size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            <Text style={styles.joinDate}>Member since January 2024</Text>
          </View>
          
          {/* Achievement Badge */}
          <View style={styles.achievementBadge}>
            <Award size={16} color="#f59e0b" />
            <Text style={styles.achievementText}>Active User</Text>
          </View>
        </View>

        {/* Enhanced Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Activity</Text>
          <View style={styles.statsGrid}>
            {renderStatsCard(
              <Users size={20} />,
              'Groups',
              stats.totalGroups,
              '#2563eb'
            )}
            {renderStatsCard(
              <DollarSign size={20} />,
              'Total Spent',
              `$${stats.totalExpenses.toFixed(0)}`,
              '#059669'
            )}
            {renderStatsCard(
              <Receipt size={20} />,
              'Transactions',
              stats.totalTransactions,
              '#ea580c'
            )}
          </View>
          
          <View style={styles.statsGrid}>
            {renderStatsCard(
              <TrendingUp size={20} />,
              'This Month',
              `$${stats.monthlySpending.toFixed(0)}`,
              '#7c3aed'
            )}
            {renderStatsCard(
              <Calendar size={20} />,
              'Avg. Expense',
              `$${stats.averageExpense.toFixed(0)}`,
              '#dc2626'
            )}
            {renderStatsCard(
              <Star size={20} />,
              'Most Active',
              stats.mostActiveGroup || 'None',
              '#f59e0b'
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {renderQuickAction(
              <Download size={20} />,
              'Export Data',
              'Download your expense data',
              handleExportData,
              '#059669'
            )}
            {renderQuickAction(
              <Share2 size={20} />,
              'Share App',
              'Invite friends to SplitSaathi',
              handleShareApp,
              '#7c3aed'
            )}
            {renderQuickAction(
              <Star size={20} />,
              'Rate App',
              'Help us improve',
              handleRateApp,
              '#f59e0b'
            )}
            {renderQuickAction(
              <Gift size={20} />,
              'Refer Friends',
              'Earn rewards',
              () => Alert.alert('Coming Soon', 'Referral program coming soon!'),
              '#ec4899'
            )}
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              <User size={20} color="#6b7280" />,
              'Edit Profile',
              'Update your personal information',
              handleEditProfile
            )}
            {renderSettingItem(
              <Mail size={20} color="#6b7280" />,
              'Email',
              user?.email || 'user@example.com',
              handleEditProfile
            )}
            {renderSettingItem(
              <Lock size={20} color="#6b7280" />,
              'Change Password',
              'Update your account password',
              handleChangePassword
            )}
            {renderSettingItem(
              <CreditCard size={20} color="#6b7280" />,
              'Payment Methods',
              'Manage eSewa and bank accounts',
              () => router.push('/profile/payment-methods')
            )}
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              <Bell size={20} color="#6b7280" />,
              'Notifications',
              'Push notifications and alerts',
              handleNotificationSettings,
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#f3f4f6', true: '#bfdbfe' }}
                thumbColor={notificationsEnabled ? '#2563eb' : '#9ca3af'}
              />,
              false
            )}
            {renderSettingItem(
              <Moon size={20} color="#6b7280" />,
              'Dark Mode',
              'Switch to dark theme',
              undefined,
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: '#f3f4f6', true: '#bfdbfe' }}
                thumbColor={darkModeEnabled ? '#2563eb' : '#9ca3af'}
              />,
              false
            )}
            {renderSettingItem(
              <Globe size={20} color="#6b7280" />,
              'Language & Region',
              'English (Nepal)',
              handleAppSettings
            )}
            {renderSettingItem(
              <Settings size={20} color="#6b7280" />,
              'App Settings',
              'Currency, date format, and more',
              handleAppSettings
            )}
          </View>
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              <Shield size={20} color="#6b7280" />,
              'Privacy Settings',
              'Control your data and privacy',
              handlePrivacySettings
            )}
            {renderSettingItem(
              <Download size={20} color="#6b7280" />,
              'Export Data',
              'Download your data as CSV',
              handleExportData
            )}
            {renderSettingItem(
              <Eye size={20} color="#6b7280" />,
              'Data Usage',
              'See how your data is used',
              () => Alert.alert('Data Usage', 'Your data is used only for app functionality and is never shared with third parties.')
            )}
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              <HelpCircle size={20} color="#6b7280" />,
              'Help & Support',
              'Get help with SplitSaathi',
              handleHelp
            )}
            {renderSettingItem(
              <Smartphone size={20} color="#6b7280" />,
              'Contact Us',
              'Get in touch with our team',
              () => Alert.alert('Contact Us', 'Email: support@splitsaathi.com\nPhone: +977-98-00000000')
            )}
            {renderSettingItem(
              <Star size={20} color="#6b7280" />,
              'Rate the App',
              'Share your feedback',
              handleRateApp
            )}
            {renderSettingItem(
              <Share2 size={20} color="#6b7280" />,
              'Share SplitSaathi',
              'Invite friends to use the app',
              handleShareApp
            )}
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              <Settings size={20} color="#6b7280" />,
              'About SplitSaathi',
              'Version 1.0.0',
              handleAbout
            )}
            {renderSettingItem(
              <Heart size={20} color="#6b7280" />,
              'Made in Nepal',
              'Built with love in Nepal 🇳🇵',
              handleAbout
            )}
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              <Trash2 size={20} color="#dc2626" />,
              'Delete Account',
              'Permanently delete your account',
              handleDeleteAccount,
              undefined,
              true,
              true
            )}
            {renderSettingItem(
              <LogOut size={20} color="#dc2626" />,
              'Logout',
              'Sign out of your account',
              handleLogout,
              undefined,
              false,
              true
            )}
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 14,
    color: '#9ca3af',
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  achievementText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickActionsGrid: {
    gap: 8,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingsGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dangerIcon: {
    backgroundColor: '#fef2f2',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  dangerText: {
    color: '#dc2626',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    color: '#d1d5db',
    marginBottom: 2,
  },
});