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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, TrendingUp, TrendingDown, DollarSign, Users, Calendar, ArrowUpRight, ArrowDownRight, CircleAlert as AlertCircle, ChartBar as BarChart3, Calculator } from 'lucide-react-native';
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

  const fetchData = async () => {
    try {
      setError(null);
      console.log('Fetching dashboard data...');
      
      const groupsData = await apiService.getGroups();
      console.log('Groups fetched:', groupsData.length);
      setGroups(groupsData);
      
      // Get recent expenses from all groups
      const allExpenses: Expense[] = [];
      for (const group of groupsData.slice(0, 5)) { // Limit to first 5 groups for performance
        try {
          const expenses = await apiService.getGroupExpenses(group.id);
          allExpenses.push(...expenses);
        } catch (expenseError) {
          console.warn(`Failed to fetch expenses for group ${group.id}:`, expenseError);
        }
      }
      
      // Sort by date and take the 5 most recent
      const sortedExpenses = allExpenses
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      console.log('Recent expenses fetched:', sortedExpenses.length);
      setRecentExpenses(sortedExpenses);

      // Get usage stats
      const stats = await limitService.getUsageStats();
      setUsageStats(stats);
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
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color="#dc2626" />
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
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>Good morning!</Text>
            <Text style={styles.subtitle}>Here's your expense overview</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/add-expense-quick')}
          >
            <Plus size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Usage Stats */}
        <View style={styles.usageSection}>
          <Text style={styles.usageSectionTitle}>Daily Usage</Text>
          <View style={styles.usageCards}>
            <View style={styles.usageCard}>
              <View style={styles.usageHeader}>
                <DollarSign size={20} color="#2563eb" />
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
                      width: `${(usageStats.transactions.used / usageStats.transactions.total) * 100}%`,
                      backgroundColor: usageStats.transactions.used >= usageStats.transactions.total ? '#dc2626' : '#2563eb'
                    }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.usageCard}>
              <View style={styles.usageHeader}>
                <Users size={20} color="#059669" />
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
                      width: `${(usageStats.groups.used / usageStats.groups.total) * 100}%`,
                      backgroundColor: usageStats.groups.used >= usageStats.groups.total ? '#dc2626' : '#059669'
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>

        {/* Balance Cards */}
        <View style={styles.balanceSection}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <DollarSign size={24} color="#2563eb" />
              <Text style={styles.balanceTitle}>Net Balance</Text>
            </View>
            <Text style={[
              styles.balanceAmount,
              totalBalance >= 0 ? styles.positiveBalance : styles.negativeBalance
            ]}>
              {totalBalance >= 0 ? '+' : ''}${totalBalance.toFixed(2)}
            </Text>
            <Text style={styles.balanceSubtext}>
              {totalBalance >= 0 ? 'You are owed overall' : 'You owe overall'}
            </Text>
          </View>

          <View style={styles.balanceRow}>
            <View style={[styles.balanceCard, styles.smallCard]}>
              <View style={styles.balanceHeader}>
                <ArrowUpRight size={20} color="#059669" />
                <Text style={styles.smallCardTitle}>You're Owed</Text>
              </View>
              <Text style={[styles.balanceAmount, styles.positiveBalance, styles.smallAmount]}>
                ${totalOwed.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.balanceCard, styles.smallCard]}>
              <View style={styles.balanceHeader}>
                <ArrowDownRight size={20} color="#dc2626" />
                <Text style={styles.smallCardTitle}>You Owe</Text>
              </View>
              <Text style={[styles.balanceAmount, styles.negativeBalance, styles.smallAmount]}>
                ${totalOwing.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/groups')}
            >
              <Users size={24} color="#2563eb" />
              <Text style={styles.actionTitle}>View Groups</Text>
              <Text style={styles.actionSubtitle}>{groups.length} active groups</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/add-group')}
            >
              <Plus size={24} color="#059669" />
              <Text style={styles.actionTitle}>New Group</Text>
              <Text style={styles.actionSubtitle}>Start splitting expenses</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/add-expense-advanced')}
            >
              <Calculator size={24} color="#ea580c" />
              <Text style={styles.actionTitle}>Advanced Split</Text>
              <Text style={styles.actionSubtitle}>Multi-payer & custom splits</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentExpenses.length > 0 ? (
            <View style={styles.activityList}>
              {recentExpenses.map((expense) => {
                const group = groups.find(g => g.id === expense.groupId);
                return (
                  <TouchableOpacity 
                    key={expense.id} 
                    style={styles.activityItem}
                    onPress={() => router.push(`/group/${expense.groupId}`)}
                  >
                    <View style={styles.activityIcon}>
                      <DollarSign size={16} color="#6b7280" />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{expense.description}</Text>
                      <Text style={styles.activitySubtitle}>
                        {group?.name || 'Unknown Group'} • Paid by {expense.paidBy}
                        {expense.splitType && expense.splitType !== 'equal' && (
                          <Text style={styles.splitTypeIndicator}> • {expense.splitType} split</Text>
                        )}
                      </Text>
                    </View>
                    <View style={styles.activityRight}>
                      <Text style={styles.activityAmount}>${expense.amount.toFixed(2)}</Text>
                      <Text style={styles.activityDate}>{formatDate(expense.createdAt)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No recent activity</Text>
              <Text style={styles.emptySubtitle}>Start adding expenses to see them here</Text>
              <TouchableOpacity 
                style={styles.addFirstButton}
                onPress={() => router.push('/add-expense-quick')}
              >
                <Plus size={16} color="#2563eb" />
                <Text style={styles.addFirstText}>Add First Expense</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Active Groups Preview */}
        {groups.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Groups</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/groups')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupsScroll}>
              {groups.slice(0, 5).map((group) => {
                const userBalance = Object.values(group.balances).reduce((sum, balance) => sum + balance, 0);
                return (
                  <TouchableOpacity
                    key={group.id}
                    style={styles.groupPreviewCard}
                    onPress={() => router.push(`/group/${group.id}`)}
                  >
                    <View style={styles.groupPreviewHeader}>
                      <Text style={styles.groupPreviewName}>{group.name}</Text>
                      <View style={styles.membersBadge}>
                        <Users size={12} color="#6b7280" />
                        <Text style={styles.membersCount}>{group.members.length}</Text>
                      </View>
                    </View>
                    <Text style={styles.groupPreviewTotal}>${group.totalExpenses.toFixed(2)}</Text>
                    <Text style={[
                      styles.groupPreviewBalance,
                      userBalance >= 0 ? styles.positiveBalance : styles.negativeBalance
                    ]}>
                      {userBalance >= 0 ? '+' : ''}${userBalance.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/add-expense-quick')}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>
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
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#dc2626',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  addButton: {
    backgroundColor: '#2563eb',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  usageSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  usageSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  usageCards: {
    flexDirection: 'row',
    gap: 12,
  },
  usageCard: {
    flex:  1,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  usageTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  usageCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  usageBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  usageProgress: {
    height: '100%',
    borderRadius: 2,
  },
  balanceSection: {
    padding: 20,
  },
  balanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  positiveBalance: {
    color: '#059669',
  },
  negativeBalance: {
    color: '#dc2626',
  },
  balanceSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  smallCard: {
    flex: 1,
    marginBottom: 0,
  },
  smallCardTitle: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  smallAmount: {
    fontSize: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
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
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  activityList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  splitTypeIndicator: {
    color: '#ea580c',
    fontWeight: '600',
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  addFirstText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  groupsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  groupPreviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  groupPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupPreviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  membersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  membersCount: {
    marginLeft: 2,
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
  },
  groupPreviewTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  groupPreviewBalance: {
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2563eb',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});