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
  SafeAreaView,
  FlatList,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, DollarSign, Users, Calculator, Percent, Hash, Plus, Minus, Calendar } from 'lucide-react-native';
import { Group } from '@/types';
import { apiService } from '@/services/api';
import { limitService } from '@/services/limitService';
import AdModal from '@/components/AdModal';
import DateTimePicker from '@react-native-community/datetimepicker';

const SPLIT_METHODS = [
  { key: 'equal', label: 'Equal', icon: Users },
  { key: 'unequal', label: 'Unequal', icon: Calculator },
  { key: 'percentage', label: 'Percent', icon: Percent },
  { key: 'shares', label: 'Shares', icon: Hash },
];

function getInitials(name: string): string {
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
}

export default function AddAdvancedExpenseScreen() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [payers, setPayers] = useState<{ name: string; amountPaid: string }[]>([]);
  const [splitType, setSplitType] = useState<'equal' | 'unequal' | 'percentage' | 'shares'>('equal');
  const [participants, setParticipants] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [canAddExpense, setCanAddExpense] = useState(true);
  const [remainingTransactions, setRemainingTransactions] = useState(0);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const groupsData = await apiService.getGroups();
        setGroups(groupsData);
        if (groupId) {
          const group = groupsData.find(g => g.id === groupId);
          if (group) {
            setSelectedGroup(group);
            setPayers([{ name: group.members[0], amountPaid: '' }]);
            setParticipants(group.members.map(m => ({ name: m, share: '' })));
          }
        } else if (groupsData.length > 0) {
          setSelectedGroup(groupsData[0]);
          setPayers([{ name: groupsData[0].members[0], amountPaid: '' }]);
          setParticipants(groupsData[0].members.map(m => ({ name: m, share: '' })));
        }
      } catch (error) {
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

  // --- UI Handlers ---
  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
    setPayers([{ name: group.members[0], amountPaid: '' }]);
    setParticipants(group.members.map(m => ({ name: m, share: '' })));
    setGroupModalVisible(false);
  };

  const handleAddPayer = () => {
    if (!selectedGroup) return;
    const available = selectedGroup.members.filter(m => !payers.some(p => p.name === m));
    if (available.length > 0) {
      setPayers([...payers, { name: available[0], amountPaid: '' }]);
    }
  };
  const handleRemovePayer = (idx: number) => {
    if (payers.length > 1) setPayers(payers.filter((_, i) => i !== idx));
  };
  const handlePayerName = (idx: number, name: string) => {
    if (payers.some((p, i) => p.name === name && i !== idx)) return;
    setPayers(payers.map((p, i) => (i === idx ? { ...p, name } : p)));
  };
  const handlePayerAmount = (idx: number, value: string) => {
    setPayers(payers.map((p, i) => (i === idx ? { ...p, amountPaid: value.replace(/[^0-9.]/g, '') } : p)));
  };

  const handleSplitType = (type: any) => {
    setSplitType(type);
    if (!selectedGroup) return;
    const total = parseFloat(totalAmount) || 0;
    if (type === 'equal') {
      const per = total / selectedGroup.members.length;
      setParticipants(selectedGroup.members.map(m => ({ name: m, share: per ? per.toFixed(2) : '' })));
    } else if (type === 'percentage') {
      setParticipants(selectedGroup.members.map(m => ({ name: m, share: (100 / selectedGroup.members.length).toFixed(1) })));
    } else if (type === 'shares') {
      setParticipants(selectedGroup.members.map(m => ({ name: m, share: '1' })));
    } else {
      setParticipants(selectedGroup.members.map(m => ({ name: m, share: '' })));
    }
  };
  const handleParticipantShare = (idx: number, value: string) => {
    setParticipants(participants.map((p, i) => (i === idx ? { ...p, share: value.replace(/[^0-9.]/g, '') } : p)));
  };

  // --- Date Picker Handler ---
  const handleDateChange = (event: any, selected?: Date) => {
    setDatePickerVisible(false);
    if (selected) {
      setDate(selected.toISOString().split('T')[0]);
    }
  };

  // --- Validation and Submission ---
  const getTotalPaid = () => payers.reduce((sum, p) => sum + (parseFloat(p.amountPaid) || 0), 0);
  const getTotalSplit = () => {
    if (splitType === 'equal' || splitType === 'unequal') {
      return participants.reduce((sum, p) => sum + (parseFloat(p.share) || 0), 0);
    } else if (splitType === 'percentage') {
      return participants.reduce((sum, p) => sum + (parseFloat(p.share) || 0), 0);
    } else if (splitType === 'shares') {
      return participants.reduce((sum, p) => sum + (parseFloat(p.share) || 0), 0);
    }
    return 0;
  };
  const validateExpense = () => {
    const errors: any = {};
    if (!description.trim()) errors.description = 'Enter a description';
    if (!totalAmount || parseFloat(totalAmount) <= 0) errors.totalAmount = 'Enter a valid amount';
    if (getTotalPaid() !== parseFloat(totalAmount)) errors.paid = 'Total paid must match total amount';
    if (splitType === 'equal' || splitType === 'unequal') {
      if (getTotalSplit() !== parseFloat(totalAmount)) errors.split = 'Total split must match total amount';
    } else if (splitType === 'percentage') {
      if (Math.abs(getTotalSplit() - 100) > 0.1) errors.split = 'Total percentage must be 100%';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSubmit = async () => {
    if (!validateExpense()) return;
    setSubmitting(true);
    try {
      const expenseData = {
        groupId: selectedGroup!.id,
        description: description.trim(),
        amount: parseFloat(totalAmount),
        paidBy: payers.length === 1 ? payers[0].name : 'Multiple',
        payers: payers.map(p => ({ name: p.name, amountPaid: parseFloat(p.amountPaid) })),
        participants: participants.map(p => p.name),
        splits: participants.map(p => ({ participant: p.name, amount: parseFloat(p.share) })),
        splitType,
        date,
      };
      await apiService.createUnequalExpense(expenseData);
      await limitService.incrementTransactions();
      Alert.alert('Success', 'Expense added!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      console.error('Create unequal expense error:', e);
      let message = 'Failed to add expense.';
      if (e?.response?.data?.message) message = e.response.data.message;
      else if (e?.message) message = e.message;
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Group Modal ---
  const renderGroupModal = () => (
    <Modal
      visible={groupModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setGroupModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.groupModalCard}>
          <Text style={styles.groupModalTitle}>Select Group</Text>
          <ScrollView style={{ maxHeight: 350 }}>
            {groups.map(group => (
              <Pressable
                key={group.id}
                style={[styles.groupModalItem, selectedGroup?.id === group.id && styles.groupModalItemSelected]}
                onPress={() => handleSelectGroup(group)}
              >
                <View style={styles.groupModalAvatars}>
                  {group.members.slice(0, 3).map(m => (
                    <View key={m} style={styles.groupModalAvatar}><Text style={styles.groupModalAvatarText}>{getInitials(m)}</Text></View>
                  ))}
                  {group.members.length > 3 && (
                    <View style={styles.groupModalAvatar}><Text style={styles.groupModalAvatarText}>+{group.members.length - 3}</Text></View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.groupModalName}>{group.name}</Text>
                  <Text style={styles.groupModalMembers}>{group.members.length} members</Text>
                </View>
                {selectedGroup?.id === group.id && <Text style={styles.groupModalCheck}>✓</Text>}
              </Pressable>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.groupModalClose} onPress={() => setGroupModalVisible(false)}>
            <Text style={styles.groupModalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Expense</Text>
      </View>
      {/* Group Selector (modal dropdown style) */}
      <TouchableOpacity style={styles.groupSelectorCard} onPress={() => setGroupModalVisible(true)} activeOpacity={0.85}>
        <View style={styles.groupSelectorRow}>
          <View style={styles.groupSelectorAvatars}>
            {selectedGroup?.members.slice(0, 3).map(m => (
              <View key={m} style={styles.groupSelectorAvatar}><Text style={styles.groupSelectorAvatarText}>{getInitials(m)}</Text></View>
            ))}
            {selectedGroup && selectedGroup.members.length > 3 && (
              <View style={styles.groupSelectorAvatar}><Text style={styles.groupSelectorAvatarText}>+{selectedGroup.members.length - 3}</Text></View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.groupSelectorName}>{selectedGroup?.name || 'Select Group'}</Text>
            <Text style={styles.groupSelectorMembers}>{selectedGroup?.members.length || 0} members</Text>
          </View>
          <Text style={styles.groupSelectorDropdown}>▼</Text>
        </View>
      </TouchableOpacity>
      {renderGroupModal()}
      {/* Main Scrollable Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Expense Card */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <DollarSign size={28} color="#2563eb" />
            <TextInput
              style={styles.amountInput}
              value={totalAmount}
              onChangeText={setTotalAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              maxLength={10}
            />
          </View>
          <TextInput
            style={styles.descInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Description (e.g. Dinner)"
            maxLength={100}
          />
          <TouchableOpacity style={styles.dateRow} onPress={() => setDatePickerVisible(true)}>
            <Calendar size={18} color="#6b7280" />
            <Text style={styles.dateText}>{date}</Text>
            <Text style={styles.dateEdit}>Edit</Text>
          </TouchableOpacity>
          {formErrors.description && <Text style={styles.errorText}>{formErrors.description}</Text>}
          {formErrors.totalAmount && <Text style={styles.errorText}>{formErrors.totalAmount}</Text>}
        </View>
        {/* Who Paid (vertical column) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Who paid?</Text>
          <View style={styles.payerColumn}>
            {payers.map((payer, idx) => (
              <View key={idx} style={styles.payerPillRowCol}>
                <TouchableOpacity
                  style={styles.payerPill}
                  onPress={() => {}}
                  activeOpacity={1}
                >
                  <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(payer.name)}</Text></View>
                  <Text style={styles.payerName}>{payer.name}</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.payerAmountInput}
                  value={payer.amountPaid}
                  onChangeText={v => handlePayerAmount(idx, v)}
                  placeholder="$0.00"
                  keyboardType="decimal-pad"
                  maxLength={10}
                />
                {payers.length > 1 && (
                  <TouchableOpacity style={styles.removePayerBtn} onPress={() => handleRemovePayer(idx)}>
                    <Minus size={16} color="#dc2626" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {selectedGroup && payers.length < selectedGroup.members.length && (
              <TouchableOpacity style={styles.addPayerBtnCol} onPress={handleAddPayer}>
                <Plus size={20} color="#2563eb" />
                <Text style={styles.addPayerBtnColText}>Add payer</Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Remaining amount display */}
          {(() => {
            const total = parseFloat(totalAmount) || 0;
            const paid = payers.reduce((sum, p) => sum + (parseFloat(p.amountPaid) || 0), 0);
            const remaining = total - paid;
            let color = '#f59e42'; // orange
            if (remaining === 0) color = '#059669'; // green
            if (remaining < 0) color = '#dc2626'; // red
            return (
              <View style={{ marginTop: 6, marginBottom: 2, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#6b7280', fontWeight: '500', marginRight: 6 }}>Remaining:</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color }}>{remaining >= 0 ? `$${remaining.toFixed(2)}` : `-$${Math.abs(remaining).toFixed(2)}`}</Text>
              </View>
            );
          })()}
          {formErrors.paid && <Text style={styles.errorText}>{formErrors.paid}</Text>}
        </View>
        {/* Split Method */}
        <View style={styles.card}>
          <View style={styles.segmentedControl}>
            {SPLIT_METHODS.map(method => {
              const Icon = method.icon;
              return (
                <TouchableOpacity
                  key={method.key}
                  style={[styles.segmentBtn, splitType === method.key && styles.segmentBtnActive]}
                  onPress={() => handleSplitType(method.key)}
                >
                  <Icon size={18} color={splitType === method.key ? '#fff' : '#2563eb'} />
                  <Text style={[styles.segmentBtnText, splitType === method.key && styles.segmentBtnTextActive]}>{method.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        {/* Participants List */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Split between</Text>
          <FlatList
            data={participants}
            keyExtractor={item => item.name}
            renderItem={({ item, index }) => (
              <View style={styles.participantRow}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(item.name)}</Text></View>
                <Text style={styles.participantName}>{item.name}</Text>
                <TextInput
                  style={styles.participantShareInput}
                  value={item.share}
                  onChangeText={v => handleParticipantShare(index, v)}
                  placeholder={splitType === 'percentage' ? '% share' : splitType === 'shares' ? 'shares' : '$0.00'}
                  keyboardType="decimal-pad"
                  maxLength={10}
                  editable={splitType !== 'equal' ? true : false}
                />
              </View>
            )}
          />
        </View>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>Total paid: <Text style={{ fontWeight: '700' }}>${getTotalPaid().toFixed(2)}</Text></Text>
          <Text style={styles.summaryText}>
            {splitType === 'percentage' ? 'Total %: ' : splitType === 'shares' ? 'Total shares: ' : 'Total split: '}
            <Text style={{ fontWeight: '700' }}>{getTotalSplit().toFixed(2)}{splitType === 'percentage' ? '%' : ''}</Text>
          </Text>
          {formErrors.split && <Text style={styles.errorText}>{formErrors.split}</Text>}
        </View>
      </ScrollView>
      {/* Date Picker Modal */}
      {datePickerVisible && (
        <DateTimePicker
          value={new Date(date)}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
      {/* Sticky Add Button */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          style={[styles.addBtn, (!canAddExpense || submitting) && styles.addBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canAddExpense || submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.addBtnText}>Add Expense</Text>}
        </TouchableOpacity>
      </View>
      <AdModal
        visible={showAdModal}
        onClose={() => setShowAdModal(false)}
        onAdWatched={() => {}}
        adType="transaction"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 32 : 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  groupSelectorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 2,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  groupSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupSelectorAvatars: {
    flexDirection: 'row',
    marginRight: 12,
  },
  groupSelectorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e7ef',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  groupSelectorAvatarText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 15,
  },
  groupSelectorName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  groupSelectorMembers: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  groupSelectorDropdown: {
    fontSize: 20,
    color: '#2563eb',
    marginLeft: 8,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupModalCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  groupModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 16,
    textAlign: 'center',
  },
  groupModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    marginBottom: 4,
  },
  groupModalItemSelected: {
    backgroundColor: '#eff6ff',
  },
  groupModalAvatars: {
    flexDirection: 'row',
    marginRight: 12,
  },
  groupModalAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e7ef',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  groupModalAvatarText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 13,
  },
  groupModalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  groupModalMembers: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  groupModalCheck: {
    fontSize: 18,
    color: '#059669',
    fontWeight: '700',
    marginLeft: 8,
  },
  groupModalClose: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  groupModalCloseText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  amountInput: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2563eb',
    marginLeft: 12,
    flex: 1,
    backgroundColor: 'transparent',
  },
  descInput: {
    fontSize: 16,
    color: '#374151',
    marginTop: 4,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  payerPillRowCol: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  payerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ef',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  payerName: { fontSize: 15, color: '#2563eb', fontWeight: '600', marginLeft: 6 },
  payerAmountInput: {
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 70,
    marginLeft: 4,
  },
  removePayerBtn: {
    marginLeft: 6,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  addPayerBtnCol: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ef',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  addPayerBtnColText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 6,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  segmentBtnActive: {
    backgroundColor: '#2563eb',
  },
  segmentBtnText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '600',
    color: '#2563eb',
  },
  segmentBtnTextActive: {
    color: '#fff',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e7ef',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: { color: '#2563eb', fontWeight: '700', fontSize: 15 },
  participantName: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '500' },
  participantShareInput: {
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 70,
    marginLeft: 4,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 80,
  },
  summaryText: { fontSize: 15, color: '#374151', marginBottom: 2 },
  errorText: { color: '#dc2626', fontSize: 13, marginTop: 4, marginBottom: 2 },
  stickyFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  addBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  addBtnDisabled: {
    backgroundColor: '#9ca3af',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
  },
  dateText: {
    marginLeft: 8,
    color: '#6b7280',
    fontSize: 15,
    flex: 1,
  },
  dateEdit: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 14,
  },
  payerColumn: {
    flexDirection: 'column',
    gap: 10,
  },
});