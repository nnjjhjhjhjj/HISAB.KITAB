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
import { Plus, X, Users, ArrowLeft, Play } from 'lucide-react-native';

const apiService = {
  createGroup: async (groupData: any) => {
    // Simulate API call
    return new Promise(resolve => setTimeout(resolve, 1500));
  }
};

const limitService = {
  canCreateGroup: async () => {
    return {
      canAdd: true,
      remaining: 3,
      needsAd: false
    };
  },
  incrementGroups: async () => {},
  addGroupBonus: async () => {}
};

const AdModal = ({ visible, onClose, onAdWatched }: any) => {
  if (!visible) return null;
  
  return (
    <View style={styles.adModalOverlay}>
      <View style={styles.adModal}>
        <Text style={styles.adModalTitle}>Watch a Short Ad</Text>
        <Text style={styles.adModalText}>Watch a 30-second ad to create one additional group today.</Text>
        
        <View style={styles.adPlaceholder}>
          <Text style={styles.adPlaceholderText}>Ad Content Here</Text>
        </View>
        
        <View style={styles.adModalButtons}>
          <TouchableOpacity style={styles.adModalButtonSecondary} onPress={onClose}>
            <Text style={styles.adModalButtonSecondaryText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.adModalButtonPrimary} onPress={onAdWatched}>
            <Text style={styles.adModalButtonPrimaryText}>Watch Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function AddGroupScreen() {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [canCreateGroup, setCanCreateGroup] = useState(true);
  const [remainingGroups, setRemainingGroups] = useState(0);

  useEffect(() => {
    const checkLimits = async () => {
      const { canAdd, remaining } = await limitService.canCreateGroup();
      setCanCreateGroup(canAdd);
      setRemainingGroups(remaining);
    };

    checkLimits();
  }, []);

  const addMember = () => {
    setMembers([...members, '']);
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      const newMembers = members.filter((_, i) => i !== index);
      setMembers(newMembers);
    }
  };

  const updateMember = (index: number, value: string) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
  };

  const handleCreateGroup = async () => {
    // Check limits first
    const { canAdd, needsAd } = await limitService.canCreateGroup();
    
    if (!canAdd) {
      if (needsAd) {
        setShowAdModal(true);
        return;
      } else {
        Alert.alert(
          'Daily Limit Reached',
          'You\'ve reached your daily group creation limit. Try again tomorrow or watch ads for more groups.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    // Validation
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    const validMembers = members.filter(member => member.trim() !== '');
    if (validMembers.length === 0) {
      Alert.alert('Error', 'Please add at least one member');
      return;
    }

    setLoading(true);
    try {
      await apiService.createGroup({
        name: groupName.trim(),
        description: description.trim(),
        members: validMembers,
      });

      // Increment group count
      await limitService.incrementGroups();

      Alert.alert('Success', 'Group created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setGroupName('');
            setDescription('');
            setMembers(['']);
            // Navigate back
            router.back();
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create group. Please try again.');
      console.error('Error creating group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdWatched = async () => {
    await limitService.addGroupBonus();
    const { canAdd, remaining } = await limitService.canCreateGroup();
    setCanCreateGroup(canAdd);
    setRemainingGroups(remaining);
    setShowAdModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Create New Group</Text>
          <Text style={styles.subtitle}>
            {remainingGroups} groups remaining today
          </Text>
        </View>
      </View>

      {/* Limit Warning */}
      {!canCreateGroup && (
        <View style={styles.limitWarning}>
          <Text style={styles.limitWarningText}>
            Daily limit reached! Watch an ad to create 1 more group.
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
        <View style={styles.card}>
          <Text style={styles.label}>Group Name *</Text>
          <TextInput
            style={styles.input}
            value={groupName}
            onChangeText={setGroupName}
            placeholder="e.g., Trip to Europe, Roommate Expenses"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description for this group"
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={3}
            maxLength={200}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.membersHeader}>
            <Text style={styles.label}>Members *</Text>
            <TouchableOpacity style={styles.addButton} onPress={addMember}>
              <Plus size={16} color="#4f46e5" />
              <Text style={styles.addButtonText}>Add Member</Text>
            </TouchableOpacity>
          </View>

          {members.map((member, index) => (
            <View key={index} style={styles.memberRow}>
              <View style={styles.memberIndex}>
                <Text style={styles.memberIndexText}>{index + 1}</Text>
              </View>
              <TextInput
                style={[styles.input, styles.memberInput]}
                value={member}
                onChangeText={(value) => updateMember(index, value)}
                placeholder={`Member ${index + 1} name`}
                placeholderTextColor="#94a3b8"
                maxLength={30}
              />
              {members.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeMember(index)}
                >
                  <X size={16} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Group Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Users size={24} color="#4f46e5" />
              <Text style={styles.previewName}>{groupName || 'Group Name'}</Text>
            </View>
            {description && (
              <Text style={styles.previewDescription}>{description}</Text>
            )}
            <View style={styles.previewMembers}>
              <Text style={styles.previewMembersLabel}>
                {members.filter(m => m.trim()).length} member(s):
              </Text>
              <View style={styles.memberTags}>
                {members.filter(m => m.trim()).map((member, i) => (
                  <View key={i} style={styles.memberTag}>
                    <Text style={styles.memberTagText}>{member}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.footerContainer}
      >
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.createButton, 
              (loading || !canCreateGroup) && styles.createButtonDisabled
            ]}
            onPress={handleCreateGroup}
            disabled={loading || !canCreateGroup}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Plus size={20} color="#ffffff" />
                <Text style={styles.createButtonText}>
                  {canCreateGroup ? 'Create Group' : 'Watch Ad to Continue'}
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
        adType="group"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#4f46e5',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    marginTop: 4,
  },
  limitWarning: {
    backgroundColor: '#fffbeb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: '#4f46e5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  watchAdText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberIndex: {
    backgroundColor: '#e0e7ff',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberIndexText: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  memberInput: {
    flex: 1,
    marginRight: 10,
  },
  removeButton: {
    backgroundColor: '#fef2f2',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  previewSection: {
    marginTop: 10,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  previewName: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  previewDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 22,
  },
  previewMembers: {},
  previewMembersLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  memberTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  memberTag: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  memberTagText: {
    color: '#4f46e5',
    fontSize: 13,
    fontWeight: '500',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  createButton: {
    backgroundColor: '#4f46e5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  createButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Ad Modal Styles
  adModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  adModal: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 25,
    width: '85%',
    maxWidth: 400,
  },
  adModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  adModalText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  adPlaceholder: {
    backgroundColor: '#e2e8f0',
    height: 180,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  adPlaceholderText: {
    color: '#64748b',
    fontSize: 16,
  },
  adModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  adModalButtonSecondary: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 14,
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  adModalButtonSecondaryText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 15,
  },
  adModalButtonPrimary: {
    flex: 1,
    backgroundColor: '#4f46e5',
    padding: 14,
    borderRadius: 12,
    marginLeft: 10,
    alignItems: 'center',
  },
  adModalButtonPrimaryText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
});