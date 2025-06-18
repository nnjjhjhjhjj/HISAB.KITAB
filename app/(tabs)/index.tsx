import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
  Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  Plus, TrendingUp, TrendingDown, DollarSign, Users, Calendar, 
  ArrowUpRight, ArrowDownRight, AlertCircle, BarChart3, Calculator 
} from 'lucide-react-native';
import { Group, Expense } from '@/types';
import { apiService } from '@/services/api';
import { limitService } from '@/services/limitService';

export default function HomeScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState({
    transactions: { used: 0, total: 5 },
    groups: { used: 0, total: 3 },
  });
  const fadeAnim = useState(new Animated.Value(0))[0];

  const fetchData = async () => {
    try {
      setError(null);
      
      const groupsData = await apiService.getGroups();
      setGroups(groupsData);
      
      const allExpenses: Expense[] = [];
      for (const group of groupsData.slice(0, 5)) {
        try {
          const expenses = await apiService.getGroupExpenses(group.id);
          allExpenses.push(...expenses);
        } catch (expenseError) {
          console.warn(`Failed to fetch expenses for group ${group.id}:`, expenseError);
        }
      }
      
      const sortedExpenses = allExpenses
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      setRecentExpenses(sortedExpenses);

      const stats = await limitService.getUsageStats();
      setUsageStats(stats);
      
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalBalance = groups.reduce((sum, group) => {
    const userBalance = Object.values(group.balances).reduce((total, balance) => total + balance, 0);
    return sum + userBalance;
  }, 0);

  const totalOwed = groups.reduce((sum, group) => {
    const owed = Object.values(group.balances).reduce((total, balance) => total + Math.max(0, balance), 0);
    return sum + owed;
  }, 0);

  const totalOwing = groups.reduce((sum, group) => {
    const owing = Object.values(group.balances).reduce((total, balance) => total + Math.max(0, -balance), 0);
    return sum + owing;
  }, 0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleRetry = () => {
    setLoading(true);
    fetchData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#4A90E2']} 
            tintColor="#4A90E2"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning!</Text>
            <Text style={styles.subtitle}>Here's your expense overview</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/add-expense-quick')}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Stats Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <DollarSign size={20} color="#4A90E2" />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Net Balance</Text>
              <Text style={[styles.summaryValue, totalBalance >= 0 ? styles.positive : styles.negative]}>
                {totalBalance >= 0 ? '+' : ''}${Math.abs(totalBalance).toFixed(2)}
              </Text>
            </View>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <ArrowUpRight size={20} color="#10B981" />
            </View>
            <View>
              <Text style={styles.summaryLabel}>You're Owed</Text>
              <Text style={[styles.summaryValue, styles.positive]}>
                ${totalOwed.toFixed(2)}
              </Text>
            </View>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <ArrowDownRight size={20} color="#EF4444" />
            </View>
            <View>
              <Text style={styles.summaryLabel}>You Owe</Text>
              <Text style={[styles.summaryValue, styles.negative]}>
                ${totalOwing.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Usage Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Usage</Text>
          <View style={styles.usageContainer}>
            <View style={styles.usageCard}>
              <View style={styles.usageHeader}>
                <DollarSign size={18} color="#4A90E2" />
                <Text style={styles.usageTitle}>Transactions</Text>
              </View>
              <Text style={styles.usageCount}>
                {usageStats.transactions.used}/{usageStats.transactions.total}
              </Text>
              <View style={styles.usageBar}>
                <View 
                  style={[
                    styles.usageProgress, 
                    { 
                      width: `${Math.min(100, (usageStats.transactions.used / usageStats.transactions.total) * 100)}%`,
                      backgroundColor: usageStats.transactions.used >= usageStats.transactions.total ? '#EF4444' : '#4A90E2'
                    }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.usageCard}>
              <View style={styles.usageHeader}>
                <Users size={18} color="#10B981" />
                <Text style={styles.usageTitle}>Groups</Text>
              </View>
              <Text style={styles.usageCount}>
                {usageStats.groups.used}/{usageStats.groups.total}
              </Text>
              <View style={styles.usageBar}>
                <View 
                  style={[
                    styles.usageProgress, 
                    { 
                      width: `${Math.min(100, (usageStats.groups.used / usageStats.groups.total) * 100)}%`,
                      backgroundColor: usageStats.groups.used >= usageStats.groups.total ? '#EF4444' : '#10B981'
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionsContainer}
          >
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: '#EFF6FF' }]}
              onPress={() => router.push('/(tabs)/groups')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#4A90E2' }]}>
                <Users size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionTitle}>View Groups</Text>
              <Text style={styles.actionSubtitle}>{groups.length} active</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: '#ECFDF5' }]}
              onPress={() => router.push('/add-group')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#10B981' }]}>
                <Plus size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionTitle}>New Group</Text>
              <Text style={styles.actionSubtitle}>Start splitting</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: '#FFFBEB' }]}
              onPress={() => router.push('/add-expense-advanced')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F59E0B' }]}>
                <Calculator size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionTitle}>Advanced Split</Text>
              <Text style={styles.actionSubtitle}>Custom splits</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>

          {recentExpenses.length > 0 ? (
            <View style={styles.activityContainer}>
              {recentExpenses.map((expense) => {
                const group = groups.find(g => g.id === expense.groupId);
                return (
                  <TouchableOpacity 
                    key={expense.id} 
                    style={styles.activityCard}
                    onPress={() => router.push(`/group/${expense.groupId}`)}
                  >
                    <View style={styles.activityIcon}>
                      <DollarSign size={18} color="#4A90E2" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle} numberOfLines={1}>
                        {expense.description}
                      </Text>
                      <Text style={styles.activitySubtitle} numberOfLines={1}>
                        {group?.name || 'Unknown'} • {expense.paidBy}
                      </Text>
                    </View>
                    <View style={styles.activityAmountContainer}>
                      <Text style={styles.activityAmount}>${expense.amount.toFixed(2)}</Text>
                      <Text style={styles.activityDate}>{formatDate(expense.createdAt)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Image 
                // source={require('@/assets/images/empty-activity.png')} 
                style={styles.emptyImage}
              />
              <Text style={styles.emptyTitle}>No recent activity</Text>
              <Text style={styles.emptyText}>Record your first expense to get started</Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => router.push('/add-expense-quick')}
              >
                <Text style={styles.emptyButtonText}>Add Expense</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Active Groups */}
        {groups.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Groups</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/groups')}>
                <Text style={styles.seeAll}>See All →</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.groupsContainer}
            >
              {groups.slice(0, 5).map((group) => {
                const userBalance = Object.values(group.balances).reduce((sum, balance) => sum + balance, 0);
                return (
                  <TouchableOpacity
                    key={group.id}
                    style={styles.groupCard}
                    onPress={() => router.push(`/group/${group.id}`)}
                  >
                    <View style={styles.groupHeader}>
                      <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
                      <View style={styles.groupMembers}>
                        <Users size={14} color="#6B7280" />
                        <Text style={styles.memberCount}>{group.members.length}</Text>
                      </View>
                    </View>
                    <Text style={styles.groupTotal}>${group.totalExpenses.toFixed(2)}</Text>
                    <Text style={[
                      styles.groupBalance,
                      userBalance >= 0 ? styles.positive : styles.negative
                    ]}>
                      {userBalance >= 0 ? '+' : '-'}${Math.abs(userBalance).toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </Animated.ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/add-expense-quick')}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
    fontFamily: 'Inter-Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 24,
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
    maxWidth: '80%',
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  addButton: {
    backgroundColor: '#4A90E2',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '31%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
    fontFamily: 'Inter-Medium',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  positive: {
    color: '#10B981',
  },
  negative: {
    color: '#EF4444',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
    fontFamily: 'Inter-Bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  usageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  usageCard: {
    marginBottom: 20,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  usageTitle: {
    marginLeft: 8,
    fontSize: 14,
    color: '#334155',
    fontFamily: 'Inter-Medium',
  },
  usageCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  usageBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageProgress: {
    height: '100%',
    borderRadius: 3,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    width: 160,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  activityContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
    marginRight: 8,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  activitySubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  activityAmountContainer: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  activityDate: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter-Regular',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Inter-Regular',
    maxWidth: '80%',
  },
  emptyButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  groupsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  groupCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
    fontFamily: 'Inter-SemiBold',
  },
  groupMembers: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  memberCount: {
    marginLeft: 4,
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  groupTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  groupBalance: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: '#4A90E2',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});