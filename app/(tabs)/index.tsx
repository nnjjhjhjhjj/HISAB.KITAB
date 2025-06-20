import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Users, FileText, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Wallet } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '@/services/api';
import type { Group, Expense, User } from '@/types';

const COLORS = {
  primary: '#6c5ce7',
  secondary: '#00b894',
  accent: '#fbc2eb',
  background: '#f5f7fa',
  card: 'rgba(255,255,255,0.85)',
  glass: 'rgba(255,255,255,0.6)',
  border: '#e0e3eb',
  text: '#22223b',
  subtext: '#636e72',
  positive: '#00b894',
  negative: '#e17055',
  shadow: '#d1d8e0',
};

function getNetBalance(groups: Group[], userId: string) {
  let net = 0;
  groups.forEach(g => {
    if (g.balances && g.balances[userId]) net += g.balances[userId];
  });
  return net;
}

export default function HomeScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [groupsRes, expensesRes, userRes] = await Promise.all([
        apiService.getGroups(),
        apiService.getAllExpenses(),
        apiService.getUserProfile(),
      ]);
      setGroups(groupsRes);
      setExpenses(expensesRes);
      setUser(userRes);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } catch (err: any) {
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fadeAnim]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  // --- UI Components ---
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.greeting}>
          {user ? `Hi, ${user.name.split(' ')[0]} 👋` : 'Welcome!'}
        </Text>
        <Text style={styles.subtitle}>Your smart expense dashboard</Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/add-expense-quick')}
        activeOpacity={0.85}
      >
        <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.addButtonGradient}>
          <Plus size={26} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderNetBalance = () => {
    if (!user) return null;
    const net = getNetBalance(groups, user.id);
    const isPositive = net >= 0;
    return (
      <LinearGradient
        colors={isPositive ? [COLORS.primary, COLORS.secondary] : [COLORS.negative, COLORS.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.netBalanceCard}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Wallet size={32} color="#fff" style={{ marginRight: 16 }} />
          <View>
            <Text style={styles.netBalanceLabel}>Net Balance</Text>
            <Text style={[styles.netBalanceValue, { color: isPositive ? COLORS.positive : COLORS.negative }]}>₹{Math.abs(net).toFixed(2)}</Text>
            <Text style={styles.netBalanceSub}>{isPositive ? 'You are owed' : 'You owe'}</Text>
          </View>
        </View>
      </LinearGradient>
    );
  };

  const renderGroups = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Groups</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/groups')}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      {groups.length === 0 ? (
        <Text style={styles.emptyText}>No groups yet. Create one to get started!</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupsRow}>
          {groups.map((group, idx) => (
            <TouchableOpacity
              key={group.id}
              style={[styles.groupCard, { marginLeft: idx === 0 ? 0 : 16 }]}
              onPress={() => router.push(`/group/${group.id}`)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.accent]}
                style={styles.groupGradient}
              >
                <View style={styles.groupAvatarWrap}>
                  <View style={styles.groupAvatar}>
                    <Users size={20} color={COLORS.primary} />
                  </View>
                </View>
                <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
                <Text style={styles.groupStat}>{group.members.length} members</Text>
                <Text style={styles.groupStat}>₹{group.totalExpenses.toFixed(2)} spent</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderRecentExpenses = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      {expenses.length === 0 ? (
        <Text style={styles.emptyText}>No expenses recorded yet.</Text>
      ) : (
        expenses.slice(0, 5).map((expense) => {
          const group = groups.find((g) => g.id === expense.groupId);
          const isPositive = user && expense.paidBy === user.name;
          return (
            <TouchableOpacity
              key={expense.id}
              style={styles.expenseCard}
              onPress={() => router.push(`/group/${expense.groupId}`)}
              activeOpacity={0.85}
            >
              <View style={[styles.expenseIcon, { backgroundColor: isPositive ? COLORS.positive : COLORS.negative }] }>
                <FileText size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.expenseTitle} numberOfLines={1}>{expense.description}</Text>
                <Text style={styles.expenseSubtitle} numberOfLines={1}>
                  {group ? group.name : 'Unknown Group'} • Paid by {expense.paidBy}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.expenseAmount, { color: isPositive ? COLORS.positive : COLORS.negative }]}>₹{expense.amount.toFixed(2)}</Text>
                <Text style={styles.expenseDate}>{new Date(expense.date || expense.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsSection}>
      <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.quickActionsGradient}>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/add-expense-advanced')} activeOpacity={0.85}>
            <View style={styles.quickActionIconWrap}>
              <Plus size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.quickActionText}>Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/add-group')} activeOpacity={0.85}>
            <View style={styles.quickActionIconWrap}>
              <Users size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.quickActionText}>New Group</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  // --- Main Render ---
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <AlertCircle size={40} color={COLORS.negative} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchAll}>
            <RefreshCw size={18} color="#fff" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderNetBalance()}
        {renderQuickActions()}
        {renderGroups()}
        {renderRecentExpenses()}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 8,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.subtext,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  addButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  addButtonGradient: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  netBalanceCard: {
    marginHorizontal: 20,
    marginBottom: 18,
    borderRadius: 22,
    padding: 22,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  netBalanceLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  netBalanceValue: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  netBalanceSub: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    opacity: 0.85,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  groupsRow: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  groupCard: {
    width: 170,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  groupGradient: {
    flex: 1,
    padding: 18,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 8,
  },
  groupAvatarWrap: {
    marginBottom: 10,
  },
  groupAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginBottom: 2,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  groupStat: {
    fontSize: 12,
    color: COLORS.subtext,
    fontFamily: 'Inter-Regular',
    marginBottom: 1,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  expenseIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  expenseSubtitle: {
    fontSize: 12,
    color: COLORS.subtext,
    fontFamily: 'Inter-Regular',
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 11,
    color: COLORS.subtext,
    fontFamily: 'Inter-Regular',
  },
  quickActionsSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  quickActionsGradient: {
    borderRadius: 18,
    padding: 18,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 18,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.glass,
    borderRadius: 14,
    paddingVertical: 18,
    marginHorizontal: 6,
    elevation: 1,
  },
  quickActionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  quickActionText: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: 'Inter-SemiBold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.subtext,
    marginTop: 16,
    fontFamily: 'Inter-Medium',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.negative,
    marginTop: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 18,
    gap: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  emptyText: {
    color: COLORS.subtext,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
});