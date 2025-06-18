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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, DollarSign, Check, X, Users, Play, Calculator, Receipt } from 'lucide-react-native';
import { Group } from '@/types';
import { apiService } from '@/services/api';
import { limitService } from '@/services/limitService';
import AdModal from '@/components/AdModal';

export default function AddExpenseQuickScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
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
        
        // Auto-select first group if available
        if (groupsData.length > 0) {
          const firstGroup = groupsData[0];
          setSelectedGroup(firstGroup);
          setSelectedParticipants(firstGroup.members);
          if (firstGroup.members.length > 0) {
            setPaidBy(firstGroup.members[0]);
          }
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
  }, []);

  const selectGroup = (group: Group) => {
    setSelectedGroup(group);
    setSelectedParticipants(group.members);
    if (group.members.length > 0) {
      setPaidBy(group.members[0]);
    }
  };

  const toggleParticipant = (member: string) => {
    setSelectedParticipants(prev => {
      if (prev.includes(member)) {
        if (prev.length === 1) {
          Alert.alert('Error', 'At least one participant is required');
          return prev;
        }
        return prev.filter(p => p !== member);
      } else {
        return [...prev, member];
      }
    });
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

    if (selectedParticipants.length === 0) {
      Alert.alert('Error', 'Please select at least one participant');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createExpense({
        groupId: selectedGroup.id,
        description: description.trim(),
        amount: numAmount,
        paidBy,
        participants: selectedParticipants,
        date,
      });

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
          <Text style={styles.title}>Add Expense</Text>
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
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Add Expense</Text>
            <Text style={styles.subtitle}>
              {remainingTransactions} transactions remaining today
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.advancedButton}
            onPress={() => router.push('/add-expense-advanced')}
          >
            <Calculator size={20} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Limit Warning */}
        {!canAddExpense && (
          <View style={styles.limitWarning}>
            <Text style={styles.limitWarningText}>
              Daily limit reached! Watch an ad to get 5 more transactions.
            </Text>
            <TouchableOpacity 
              style={styles.watchAdButton}
              onPress={() => setShowAdModal(true)}
            >
              <Play size={16} color="#ffffff" />
              <Text style={styles.watchAdText}>Watch Ad</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView 
          style={styles.form} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formContent}
        >
          {/* Group Selection */}
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
                  <View style={styles.groupOptionHeader}>
                    <Text style={[
                      styles.groupOptionText,
                      selectedGroup?.id === group.id && styles.selectedGroupOptionText,
                    ]}>
                      {group.name}
                    </Text>
                    {selectedGroup?.id === group.id && (
                      <Check size={16} color="#ffffff" />
                    )}
                  </View>
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

          {/* Expense Details */}
          <View style={styles.section}>
            <Text style={styles.label}>Expense Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description *</Text>
              <View style={styles.inputContainer}>
                <Receipt size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="e.g., Dinner at Italian restaurant"
                  placeholderTextColor="#9ca3af"
                  maxLength={100}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount *</Text>
              <View style={styles.amountContainer}>
                <DollarSign size={20} color="#6b7280" />
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                  maxLength={10}
                />
              </View>
            </View>
          </View>

          {selectedGroup && (
            <>
              {/* Paid By */}
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

              {/* Participants */}
              <View style={styles.section}>
                <Text style={styles.label}>Split between *</Text>
                <Text style={styles.participantsHelper}>
                  Select who should split this expense
                </Text>
                <View style={styles.participantsGrid}>
                  {selectedGroup.members.map((member) => (
                    <TouchableOpacity
                      key={member}
                      style={[
                        styles.participantButton,
                        selectedParticipants.includes(member) && styles.selectedParticipant,
                      ]}
                      onPress={() => toggleParticipant(member)}
                    >
                      <Text style={[
                        styles.participantText,
                        selectedParticipants.includes(member) && styles.selectedParticipantText,
                      ]}>
                        {member}
                      </Text>
                      {selectedParticipants.includes(member) ? (
                        <Check size={16} color="#059669" />
                      ) : (
                        <View style={styles.uncheckedBox} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Split Preview */}
              {selectedParticipants.length > 0 && amount && (
                <View style={styles.splitPreview}>
                  <Text style={styles.splitTitle}>Split Preview</Text>
                  <View style={styles.splitCard}>
                    <View style={styles.splitHeader}>
                      <DollarSign size={20} color="#059669" />
                      <Text style={styles.splitAmount}>
                        ${(parseFloat(amount) / selectedParticipants.length).toFixed(2)} per person
                      </Text>
                    </View>
                    <Text style={styles.splitParticipants}>
                      Split between {selectedParticipants.length} participant(s)
                    </Text>
                    <View style={styles.splitDetails}>
                      {selectedParticipants.map((participant, index) => (
                        <View key={participant} style={styles.splitDetailRow}>
                          <Text style={styles.splitDetailName}>{participant}</Text>
                          <Text style={styles.splitDetailAmount}>
                            ${(parseFloat(amount) / selectedParticipants.length).toFixed(2)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}
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
      </KeyboardAvoidingView>

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
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  advancedButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  limitWarning: {
    backgroundColor: '#fef3c7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#fbbf24',
  },
  limitWarningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
  },
  watchAdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  watchAdText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
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
  },
  formContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  groupsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  groupOption: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedGroupOption: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  groupOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  groupOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
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
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 12,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  amountInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  participantsHelper: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  participantsGrid: {
    gap: 8,
  },
  participantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedParticipant: {
    backgroundColor: '#f0fdf4',
    borderColor: '#059669',
  },
  participantText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedParticipantText: {
    color: '#059669',
  },
  uncheckedBox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 2,
  },
  splitPreview: {
    marginTop: 8,
  },
  splitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  splitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  splitAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 8,
  },
  splitParticipants: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  splitDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  splitDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  splitDetailName: {
    fontSize: 14,
    color: '#374151',
  },
  splitDetailAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
  },
  submitButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});