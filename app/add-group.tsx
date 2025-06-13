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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, X, Users, ArrowLeft, Play } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { limitService } from '@/services/limitService';
import AdModal from '@/components/AdModal';

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
  };

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

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.label}>Group Name *</Text>
          <TextInput
            style={styles.input}
            value={groupName}
            onChangeText={setGroupName}
            placeholder="e.g., Trip to Europe, Roommate Expenses"
            placeholderTextColor="#9ca3af"
            maxLength={50}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description for this group"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            maxLength={200}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.membersHeader}>
            <Text style={styles.label}>Members *</Text>
            <TouchableOpacity style={styles.addButton} onPress={addMember}>
              <Plus size={16} color="#2563eb" />
              <Text style={styles.addButtonText}>Add Member</Text>
            </TouchableOpacity>
          </View>

          {members.map((member, index) => (
            <View key={index} style={styles.memberRow}>
              <TextInput
                style={[styles.input, styles.memberInput]}
                value={member}
                onChangeText={(value) => updateMember(index, value)}
                placeholder={`Member ${index + 1} name`}
                placeholderTextColor="#9ca3af"
                maxLength={30}
              />
              {members.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeMember(index)}
                >
                  <X size={16} color="#dc2626" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Group Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Users size={20} color="#2563eb" />
              <Text style={styles.previewName}>{groupName || 'Group Name'}</Text>
            </View>
            {description && (
              <Text style={styles.previewDescription}>{description}</Text>
            )}
            <View style={styles.previewMembers}>
              <Text style={styles.previewMembersLabel}>
                {members.filter(m => m.trim()).length} member(s):
              </Text>
              <Text style={styles.previewMembersList}>
                {members.filter(m => m.trim()).join(', ') || 'No members added'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

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
  textArea: {
    height: 80,
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
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberInput: {
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  previewSection: {
    marginTop: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewName: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  previewDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  previewMembers: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  previewMembersLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  previewMembersList: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  createButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  createButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  createButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});