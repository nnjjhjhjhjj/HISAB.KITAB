import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, DollarSign, Check, X, Users, Calculator, Percent } from 'lucide-react-native';
import { Group, ExpenseSplit } from '@/types';
import { apiService } from '@/services/api';
import { limitService } from '@/services/limitService';
import AdModal from '@/components/AdModal';

type SplitType = 'equal' | 'unequal' | 'percentage';

export default function AddAdvancedExpenseScreen() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [canAddExpense, setCanAddExpense] = useState(true);
  const [remainingTransactions, setRemainingTransactions] = useState(0);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const groupsData = await apiService.getGroups();
        setGroups(groupsData);
        
        // Auto-select group if groupId is provided
        if (groupId) {
          const group = groupsData.find(g => g.id === groupId);
          if (group) {
            selectGroup(group);
          }
        } else if (groupsData.length > 0) {
          selectGroup(groupsData[0]);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
        Alert.alert('Error', 'Failed to load groups');
      } finally {
        setLoading(false);
      }
    };

    const checkLimits = async () => {
      const { canAdd, remaining } = await limitService.canAddTransaction();
      setCanAddExpense(canAdd);
      setRemainingTransactions(remaining);
    };

    fetchGroups();
    checkLimits();
  }, [groupId]);

  const selectGroup = (group: Group) => {
    setSelectedGroup(group);
    if (group.members.length > 0) {
      setPaidBy(group.members[0]);
      initializeSplits(group.members);
    }
  };

  const initializeSplits = (members: string[]) => {
    const initialSplits: ExpenseSplit[] = members.map(member => ({
      participant: member,
      amount: 0,
      percentage: splitType === 'percentage' ? Math.round(100 / members.length) : undefined,
    }));
    setSplits(initialSplits);
  };

  const updateSplitType = (newType: SplitType) => {
    setSplitType(newType);
    if (selectedGroup) {
      const totalAmount = parseFloat(amount) || 0;
      const updatedSplits = splits.map((split, index) => {
        if (newType === 'equal') {
          return {
            ...split,
            amount: totalAmount / splits.length,
            percentage: undefined,
          };
        } else if (newType === 'percentage') {
          const percentage = Math.round(100 / splits.length);
          return {
            ...split,
            amount: (totalAmount * percentage) / 100,
            percentage: percentage,
          };
        } else {
          return {
            ...split,
            amount: 0,
            percentage: undefined,
          };
        }
      });
      setSplits(updatedSplits);
    }
  };

  const updateSplitAmount = (index: number, value: string) => {
    const newSplits = [...splits];
    const numValue = parseFloat(value) || 0;
    newSplits[index].amount = numValue;
    
    if (splitType === 'percentage') {
      const totalAmount = parseFloat(amount) || 0;
      newSplits[index].percentage = totalAmount > 0 ? (numValue / totalAmount) * 100 : 0;
    }
    
    setSplits(newSplits);
  };

  const updateSplitPercentage = (index: number, value: string) => {
    const newSplits = [...splits];
    const percentage = parseFloat(value) || 0;
    const totalAmount = parseFloat(amount) || 0;
    
    newSplits[index].percentage = percentage;
    newSplits[index].amount = (totalAmount * percentage) / 100;
    
    setSplits(newSplits);
  };

  const redistributeEqually = () => {
    if (!selectedGroup || !amount) return;
    
    const totalAmount = parseFloat(amount);
    const equalAmount = totalAmount / splits.length;
    
    const updatedSplits = splits.map(split => ({
      ...split,
      amount: equalAmount,
      percentage: splitType === 'percentage' ? 100 / splits.length : undefined,
    }));
    
    setSplits(updatedSplits);
  };

  const getTotalSplitAmount = () => {
    return splits.reduce((sum, split) => sum + split.amount, 0);
  };

  const getTotalPercentage = () => {
    return splits.reduce((sum, split) => sum + (split.percentage || 0), 0);
  };

  const validateSplits = () => {
    const totalAmount = parseFloat(amount) || 0;
    const totalSplit = getTotalSplitAmount();
    const difference = Math.abs(totalAmount - totalSplit);
    
    if (difference > 0.01) {
      Alert.alert(
        'Split Mismatch',
        `Total splits (${totalSplit.toFixed(2)}) don't match expense amount (${totalAmount.toFixed(2)})`
      );
      return false;
    }
    
    if (splitType === 'percentage') {
      const totalPercentage = getTotalPercentage();
      if (Math.abs(totalPercentage - 100) > 0.1) {
        Alert.alert(
          'Percentage Error',
          `Total percentage (${totalPercentage.toFixed(1)}%) must equal 100%`
        );
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    // Check limits first
    const { canAdd, needsAd } = await limitService.canAddTransaction();
    
    if (!canAdd) {
      if (needsAd) {
        setShowAdModal(true);
        return;
      } else {
        Alert.alert(
          'Daily Limit Reached',
          'You\'ve reached your daily transaction limit. Try again tomorrow or watch ads for more transactions.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    // Validation
    if (!selectedGroup) {
      Alert.alert('Error', 'Please select a group');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!paidBy) {
      Alert.alert('Error', 'Please select who paid');
      return;
    }

    if (!validateSplits()) {
      return;
    }

    setSubmitting(true);
    try {
      if (splitType === 'equal') {
        // Use regular expense creation for equal splits
        const participants = splits.map(split => split.participant);
        await apiService.createExpense({
          groupId: selectedGroup.id,
          description: description.trim(),
          amount: numAmount,
          paidBy,
          participants,
          date,
        });
      } else {
        // Use unequal expense creation
        await apiService.createUnequalExpense({
          groupId: selectedGroup.id,
          description: description.trim(),
          amount: numAmount,
          paidBy,
          splits: splits.filter(split => split.amount > 0),
          date,
        });
      }

      // Increment transaction count
      await limitService.incrementTransactions();

      Alert.alert('Success', 'Expense added successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add expense. Please try again.');
      console.error('Error creating expense:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdWatched = async () => {
    await limitService.addTransactionBonus();
    const { canAdd, remaining } = await limitService.canAddTransaction();
    setCanAddExpense(canAdd);
    setRemainingTransactions(remaining);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (groups.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Advanced Expense</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Users size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No groups found</Text>
          <Text style={styles.emptyDescription}>
            Create a group first to start adding expenses
          </Text>
          <TouchableOpacity 
            style={styles.createGroupButton}
            onPress={() => router.push('/add-group')}
          >
            <Text style={styles.createGroupText}>Create Group</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Advanced Expense</Text>
          <Text style={styles.subtitle}>
            {remainingTransactions} transactions remaining today
          </Text>
        </View>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Group Selection */}
        {!groupId && (
          <View style={styles.section}>
            <Text style={styles.label}>Select Group *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupsScroll}>
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    styles.groupOption,
                    selectedGroup?.id === group.id && styles.selectedGroupOption,
                  ]}
                  onPress={() => selectGroup(group)}
                >
                  <Text style={[
                    styles.groupOptionText,
                    selectedGroup?.id === group.id && styles.selectedGroupOptionText,
                  ]}>
                    {group.name}
                  </Text>
                  <Text style={[
                    styles.groupOptionMembers,
                    selectedGroup?.id === group.id && styles.selectedGroupOptionMembers,
                  ]}>
                    {group.members.length} members
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="e.g., Dinner at Italian restaurant"
            placeholderTextColor="#9ca3af"
            maxLength={100}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Total Amount *</Text>
          <View style={styles.amountContainer}>
            <DollarSign size={20} color="#6b7280" />
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={(value) => {
                setAmount(value);
                if (splitType === 'equal' && selectedGroup) {
                  redistributeEqually();
                }
              }}
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
              maxLength={10}
            />
          </View>
        </View>

        {selectedGroup && (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Paid by *</Text>
              <View style={styles.optionsContainer}>
                {selectedGroup.members.map((member) => (
                  <TouchableOpacity
                    key={member}
                    style={[
                      styles.optionButton,
                      paidBy === member && styles.selectedOption,
                    ]}
                    onPress={() => setPaidBy(member)}
                  >
                    <Text style={[
                      styles.optionText,
                      paidBy === member && styles.selectedOptionText,
                    ]}>
                      {member}
                    </Text>
                    {paidBy === member && (
                      <Check size={16} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Split Type Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Split Type *</Text>
              <View style={styles.splitTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.splitTypeButton,
                    splitType === 'equal' && styles.selectedSplitType,
                  ]}
                  onPress={() => updateSplitType('equal')}
                >
                  <Users size={16} color={splitType === 'equal' ? '#ffffff' : '#6b7280'} />
                  <Text style={[
                    styles.splitTypeText,
                    splitType === 'equal' && styles.selectedSplitTypeText,
                  ]}>
                    Equal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.splitTypeButton,
                    splitType === 'unequal' && styles.selectedSplitType,
                  ]}
                  onPress={() => updateSplitType('unequal')}
                >
                  <Calculator size={16} color={splitType === 'unequal' ? '#ffffff' : '#6b7280'} />
                  <Text style={[
                    styles.splitTypeText,
                    splitType === 'unequal' && styles.selectedSplitTypeText,
                  ]}>
                    Unequal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.splitTypeButton,
                    splitType === 'percentage' && styles.selectedSplitType,
                  ]}
                  onPress={() => updateSplitType('percentage')}
                >
                  <Percent size={16} color={splitType === 'percentage' ? '#ffffff' : '#6b7280'} />
                  <Text style={[
                    styles.splitTypeText,
                    splitType === 'percentage' && styles.selectedSplitTypeText,
                  ]}>
                    Percentage
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Split Details */}
            <View style={styles.section}>
              <View style={styles.splitHeader}>
                <Text style={styles.label}>Split Details</Text>
                {splitType === 'equal' && (
                  <TouchableOpacity
                    style={styles.redistributeButton}
                    onPress={redistributeEqually}
                  >
                    <Text style={styles.redistributeText}>Redistribute</Text>
                  </TouchableOpacity>
                )}
              </View>

              {splits.map((split, index) => (
                <View key={split.participant} style={styles.splitRow}>
                  <Text style={styles.participantName}>{split.participant}</Text>
                  
                  <View style={styles.splitInputs}>
                    <View style={styles.splitAmountContainer}>
                      <DollarSign size={16} color="#6b7280" />
                      <TextInput
                        style={styles.splitAmountInput}
                        value={split.amount.toFixed(2)}
                        onChangeText={(value) => updateSplitAmount(index, value)}
                        keyboardType="decimal-pad"
                        editable={splitType !== 'equal'}
                      />
                    </View>

                    {splitType === 'percentage' && (
                      <View style={styles.splitPercentageContainer}>
                        <TextInput
                          style={styles.splitPercentageInput}
                          value={split.percentage?.toFixed(1) || '0.0'}
                          onChangeText={(value) => updateSplitPercentage(index, value)}
                          keyboardType="decimal-pad"
                        />
                        <Percent size={16} color="#6b7280" />
                      </View>
                    )}
                  </View>
                </View>
              ))}

              {/* Split Summary */}
              <View style={styles.splitSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Split:</Text>
                  <Text style={styles.summaryValue}>${getTotalSplitAmount().toFixed(2)}</Text>
                </View>
                {splitType === 'percentage' && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Percentage:</Text>
                    <Text style={[
                      styles.summaryValue,
                      Math.abs(getTotalPercentage() - 100) > 0.1 && styles.errorValue
                    ]}>
                      {getTotalPercentage().toFixed(1)}%
                    </Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Difference:</Text>
                  <Text style={[
                    styles.summaryValue,
                    Math.abs((parseFloat(amount) || 0) - getTotalSplitAmount()) > 0.01 && styles.errorValue
                  ]}>
                    ${Math.abs((parseFloat(amount) || 0) - getTotalSplitAmount()).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton, 
            (submitting || !canAddExpense) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={submitting || !canAddExpense}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <DollarSign size={20} color="#ffffff" />
              <Text style={styles.submitButtonText}>
                {canAddExpense ? 'Add Expense' : 'Watch Ad to Continue'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <AdModal
        visible={showAdModal}
        onClose={() => setShowAdModal(false)}
        onAdWatched={handleAdWatched}
        adType="transaction"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createGroupButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createGroupText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  groupsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  groupOption: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 120,
  },
  selectedGroupOption: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  groupOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  selectedGroupOptionText: {
    color: '#ffffff',
  },
  groupOptionMembers: {
    fontSize: 12,
    color: '#6b7280',
  },
  selectedGroupOptionMembers: {
    color: '#bfdbfe',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  amountInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedOption: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedOptionText: {
    color: '#ffffff',
  },
  splitTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  splitTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  selectedSplitType: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  splitTypeText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  selectedSplitTypeText: {
    color: '#ffffff',
  },
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  redistributeButton: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  redistributeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  splitInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  splitAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 80,
  },
  splitAmountInput: {
    marginLeft: 4,
    fontSize: 14,
    color: '#111827',
    textAlign: 'right',
    minWidth: 50,
  },
  splitPercentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
  },
  splitPercentageInput: {
    fontSize: 14,
    color: '#111827',
    textAlign: 'right',
    minWidth: 30,
  },
  splitSummary: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  errorValue: {
    color: '#dc2626',
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});