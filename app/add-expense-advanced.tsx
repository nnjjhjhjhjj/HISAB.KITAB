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
import { ArrowLeft, DollarSign, Check, X, Users, Calculator, Percent, Hash, Plus, Minus } from 'lucide-react-native';
import { Group, ExpenseSplit } from '@/types';
import { apiService } from '@/services/api';
import { limitService } from '@/services/limitService';
import AdModal from '@/components/AdModal';

type SplitType = 'equal' | 'unequal' | 'percentage' | 'shares';

interface Payer {
  name: string;
  amountPaid: number;
}

interface Participant {
  name: string;
  shareAmount: number;
  percentage?: number;
  shares?: number;
}

export default function AddAdvancedExpenseScreen() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [payers, setPayers] = useState<Payer[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [splitType, setSplitType] = useState<SplitType>('equal');
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
    // Initialize with first member as default payer
    if (group.members.length > 0) {
      setPayers([{ name: group.members[0], amountPaid: 0 }]);
      initializeParticipants(group.members);
    }
  };

  const initializeParticipants = (members: string[]) => {
    const initialParticipants: Participant[] = members.map(member => ({
      name: member,
      shareAmount: 0,
      percentage: splitType === 'percentage' ? Math.round(100 / members.length) : undefined,
      shares: splitType === 'shares' ? 1 : undefined,
    }));
    setParticipants(initialParticipants);
  };

  const updateSplitType = (newType: SplitType) => {
    setSplitType(newType);
    if (selectedGroup) {
      const total = parseFloat(totalAmount) || 0;
      const updatedParticipants = participants.map((participant, index) => {
        if (newType === 'equal') {
          return {
            ...participant,
            shareAmount: total / participants.length,
            percentage: undefined,
            shares: undefined,
          };
        } else if (newType === 'percentage') {
          const percentage = Math.round(100 / participants.length);
          return {
            ...participant,
            shareAmount: (total * percentage) / 100,
            percentage: percentage,
            shares: undefined,
          };
        } else if (newType === 'shares') {
          const shares = 1;
          const totalShares = participants.length;
          return {
            ...participant,
            shareAmount: (total * shares) / totalShares,
            percentage: undefined,
            shares: shares,
          };
        } else {
          return {
            ...participant,
            shareAmount: 0,
            percentage: undefined,
            shares: undefined,
          };
        }
      });
      setParticipants(updatedParticipants);
    }
  };

  const addPayer = () => {
    if (selectedGroup && payers.length < selectedGroup.members.length) {
      const availableMembers = selectedGroup.members.filter(
        member => !payers.some(payer => payer.name === member)
      );
      if (availableMembers.length > 0) {
        setPayers([...payers, { name: availableMembers[0], amountPaid: 0 }]);
      }
    }
  };

  const removePayer = (index: number) => {
    if (payers.length > 1) {
      const newPayers = payers.filter((_, i) => i !== index);
      setPayers(newPayers);
    }
  };

  const updatePayerName = (index: number, name: string) => {
    const newPayers = [...payers];
    newPayers[index].name = name;
    setPayers(newPayers);
  };

  const updatePayerAmount = (index: number, amount: string) => {
    const newPayers = [...payers];
    newPayers[index].amountPaid = parseFloat(amount) || 0;
    setPayers(newPayers);
  };

  const updateParticipantAmount = (index: number, value: string) => {
    const newParticipants = [...participants];
    const numValue = parseFloat(value) || 0;
    newParticipants[index].shareAmount = numValue;
    
    if (splitType === 'percentage') {
      const total = parseFloat(totalAmount) || 0;
      newParticipants[index].percentage = total > 0 ? (numValue / total) * 100 : 0;
    }
    
    setParticipants(newParticipants);
  };

  const updateParticipantPercentage = (index: number, value: string) => {
    const newParticipants = [...participants];
    const percentage = parseFloat(value) || 0;
    const total = parseFloat(totalAmount) || 0;
    
    newParticipants[index].percentage = percentage;
    newParticipants[index].shareAmount = (total * percentage) / 100;
    
    setParticipants(newParticipants);
  };

  const updateParticipantShares = (index: number, value: string) => {
    const newParticipants = [...participants];
    const shares = parseFloat(value) || 0;
    const total = parseFloat(totalAmount) || 0;
    const totalShares = participants.reduce((sum, p) => sum + (p.shares || 0), 0) - (participants[index].shares || 0) + shares;
    
    newParticipants[index].shares = shares;
    newParticipants[index].shareAmount = totalShares > 0 ? (total * shares) / totalShares : 0;
    
    // Recalculate all share amounts
    const updatedParticipants = newParticipants.map(p => ({
      ...p,
      shareAmount: totalShares > 0 ? (total * (p.shares || 0)) / totalShares : 0,
    }));
    
    setParticipants(updatedParticipants);
  };

  const redistributeEqually = () => {
    if (!selectedGroup || !totalAmount) return;
    
    const total = parseFloat(totalAmount);
    const equalAmount = total / participants.length;
    
    const updatedParticipants = participants.map(participant => ({
      ...participant,
      shareAmount: equalAmount,
      percentage: splitType === 'percentage' ? 100 / participants.length : undefined,
      shares: splitType === 'shares' ? 1 : undefined,
    }));
    
    setParticipants(updatedParticipants);
  };

  const getTotalPaid = () => {
    return payers.reduce((sum, payer) => sum + payer.amountPaid, 0);
  };

  const getTotalSplit = () => {
    return participants.reduce((sum, participant) => sum + participant.shareAmount, 0);
  };

  const getTotalPercentage = () => {
    return participants.reduce((sum, participant) => sum + (participant.percentage || 0), 0);
  };

  const getTotalShares = () => {
    return participants.reduce((sum, participant) => sum + (participant.shares || 0), 0);
  };

  const validateExpense = () => {
    const total = parseFloat(totalAmount) || 0;
    const totalPaid = getTotalPaid();
    const totalSplit = getTotalSplit();

    if (total <= 0) {
      Alert.alert('Error', 'Please enter a valid total amount');
      return false;
    }

    if (Math.abs(totalPaid - total) > 0.01) {
      Alert.alert(
        'Payment Mismatch',
        `Total paid (${totalPaid.toFixed(2)}) must equal total amount (${total.toFixed(2)})`
      );
      return false;
    }

    if (Math.abs(totalSplit - total) > 0.01) {
      Alert.alert(
        'Split Mismatch',
        `Total split (${totalSplit.toFixed(2)}) must equal total amount (${total.toFixed(2)})`
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

    if (!validateExpense()) {
      return;
    }

    setSubmitting(true);
    try {
      // Create the expense payload
      const expenseData = {
        groupId: selectedGroup.id,
        description: description.trim(),
        amount: parseFloat(totalAmount),
        paidBy: payers.length === 1 ? payers[0].name : 'Multiple',
        participants: participants.filter(p => p.shareAmount > 0).map(p => p.name),
        splits: participants.filter(p => p.shareAmount > 0).map(p => ({
          participant: p.name,
          amount: p.shareAmount,
          percentage: p.percentage
        })),
        date,
        payers: payers.filter(p => p.amountPaid > 0),
        splitType,
      };

      // Use the unequal expense endpoint for advanced splits
      await apiService.createUnequalExpense(expenseData);

      // Increment transaction count
      await limitService.incrementTransactions();

      Alert.alert('Success', 'Advanced expense added successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add expense. Please try again.');
      console.error('Error creating advanced expense:', error);
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
          <Text style={styles.title}>Advanced Expense</Text>
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
              value={totalAmount}
              onChangeText={(value) => {
                setTotalAmount(value);
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
            {/* Payers Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.label}>Who Paid? *</Text>
                <TouchableOpacity style={styles.addButton} onPress={addPayer}>
                  <Plus size={16} color="#2563eb" />
                  <Text style={styles.addButtonText}>Add Payer</Text>
                </TouchableOpacity>
              </View>

              {payers.map((payer, index) => (
                <View key={index} style={styles.payerRow}>
                  <View style={styles.payerSelector}>
                    <Text style={styles.payerLabel}>Payer {index + 1}</Text>
                    <View style={styles.payerDropdown}>
                      {selectedGroup.members.map((member) => (
                        <TouchableOpacity
                          key={member}
                          style={[
                            styles.memberOption,
                            payer.name === member && styles.selectedMemberOption,
                          ]}
                          onPress={() => updatePayerName(index, member)}
                        >
                          <Text style={[
                            styles.memberOptionText,
                            payer.name === member && styles.selectedMemberOptionText,
                          ]}>
                            {member}
                          </Text>
                          {payer.name === member && (
                            <Check size={16} color="#ffffff" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  <View style={styles.payerAmountContainer}>
                    <DollarSign size={16} color="#6b7280" />
                    <TextInput
                      style={styles.payerAmountInput}
                      value={payer.amountPaid.toString()}
                      onChangeText={(value) => updatePayerAmount(index, value)}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  {payers.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removePayer(index)}
                    >
                      <Minus size={16} color="#dc2626" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <View style={styles.paymentSummary}>
                <Text style={styles.summaryLabel}>Total Paid:</Text>
                <Text style={[
                  styles.summaryValue,
                  Math.abs(getTotalPaid() - (parseFloat(totalAmount) || 0)) > 0.01 && styles.errorValue
                ]}>
                  ${getTotalPaid().toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Split Type Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Split Method *</Text>
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

                <TouchableOpacity
                  style={[
                    styles.splitTypeButton,
                    splitType === 'shares' && styles.selectedSplitType,
                  ]}
                  onPress={() => updateSplitType('shares')}
                >
                  <Hash size={16} color={splitType === 'shares' ? '#ffffff' : '#6b7280'} />
                  <Text style={[
                    styles.splitTypeText,
                    splitType === 'shares' && styles.selectedSplitTypeText,
                  ]}>
                    Shares
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

              {participants.map((participant, index) => (
                <View key={participant.name} style={styles.splitRow}>
                  <Text style={styles.participantName}>{participant.name}</Text>
                  
                  <View style={styles.splitInputs}>
                    <View style={styles.splitAmountContainer}>
                      <DollarSign size={16} color="#6b7280" />
                      <TextInput
                        style={styles.splitAmountInput}
                        value={participant.shareAmount.toFixed(2)}
                        onChangeText={(value) => updateParticipantAmount(index, value)}
                        keyboardType="decimal-pad"
                        editable={splitType !== 'equal'}
                      />
                    </View>

                    {splitType === 'percentage' && (
                      <View style={styles.splitPercentageContainer}>
                        <TextInput
                          style={styles.splitPercentageInput}
                          value={participant.percentage?.toFixed(1) || '0.0'}
                          onChangeText={(value) => updateParticipantPercentage(index, value)}
                          keyboardType="decimal-pad"
                        />
                        <Percent size={16} color="#6b7280" />
                      </View>
                    )}

                    {splitType === 'shares' && (
                      <View style={styles.splitSharesContainer}>
                        <TextInput
                          style={styles.splitSharesInput}
                          value={participant.shares?.toString() || '1'}
                          onChangeText={(value) => updateParticipantShares(index, value)}
                          keyboardType="numeric"
                        />
                        <Hash size={16} color="#6b7280" />
                      </View>
                    )}
                  </View>
                </View>
              ))}

              {/* Split Summary */}
              <View style={styles.splitSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Split:</Text>
                  <Text style={[
                    styles.summaryValue,
                    Math.abs(getTotalSplit() - (parseFloat(totalAmount) || 0)) > 0.01 && styles.errorValue
                  ]}>
                    ${getTotalSplit().toFixed(2)}
                  </Text>
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

                {splitType === 'shares' && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Shares:</Text>
                    <Text style={styles.summaryValue}>
                      {getTotalShares()}
                    </Text>
                  </View>
                )}

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Difference:</Text>
                  <Text style={[
                    styles.summaryValue,
                    Math.abs((parseFloat(totalAmount) || 0) - getTotalSplit()) > 0.01 && styles.errorValue
                  ]}>
                    ${Math.abs((parseFloat(totalAmount) || 0) - getTotalSplit()).toFixed(2)}
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
                {canAddExpense ? 'Add Advanced Expense' : 'Watch Ad to Continue'}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  payerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  payerSelector: {
    flex: 1,
    marginRight: 12,
  },
  payerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  payerDropdown: {
    gap: 4,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedMemberOption: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  memberOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedMemberOptionText: {
    color: '#ffffff',
  },
  payerAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 100,
  },
  payerAmountInput: {
    marginLeft: 4,
    fontSize: 14,
    color: '#111827',
    textAlign: 'right',
    minWidth: 60,
  },
  removeButton: {
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginLeft: 8,
  },
  paymentSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  splitSharesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 50,
  },
  splitSharesInput: {
    fontSize: 14,
    color: '#111827',
    textAlign: 'right',
    minWidth: 20,
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