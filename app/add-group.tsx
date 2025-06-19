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
  Share,
  Clipboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, X, Users, ArrowLeft, Play, Link, Share2 } from 'lucide-react-native';
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
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [createdGroup, setCreatedGroup] = useState<any>(null);

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

  const generateShareLink = (groupId: string) => {
    return `https://splitsaathi.up.railway.app/join/${groupId}`;
  };

  const handleCopyLink = async () => {
    if (!shareableLink) return;
    
    await Clipboard.setString(shareableLink);
    Alert.alert('Copied!', 'Group link copied to clipboard');
  };

  const handleShareLink = async () => {
    if (!shareableLink) return;
    
    try {
      await Share.share({
        message: `Join my expense group "${groupName}" on SplitSaathi: ${shareableLink}`,
        title: 'Join my Expense Group'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share group link');
      console.error('Sharing failed:', error);
    }
  };

  const resetForm = () => {
    setGroupName('');
    setDescription('');
    setMembers(['']);
    setShareableLink(null);
    setCreatedGroup(null);
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

    // Validation - only group name is required
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    setLoading(true);
    try {
      // Filter out empty member names
      const validMembers = members.filter(member => member.trim() !== '');
      
      // Create group and get full group object
      const newGroup = await apiService.createGroup({
        name: groupName.trim(),
        description: description.trim(),
        members: validMembers,
      });

      console.log('Created group:', newGroup);

      // Set the created group and generate shareable link
      setCreatedGroup(newGroup);
      const link = generateShareLink(newGroup.id);
      setShareableLink(link);

      // Increment group count
      await limitService.incrementGroups();

      Alert.alert('Success', 'Group created successfully!');
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

  const handleGoToGroup = () => {
    if (createdGroup) {
      // Navigate to the newly created group
      router.replace(`/group/${createdGroup.id}`);
    } else {
      // Go back to groups list
      router.replace('/(tabs)/groups');
    }
  };

  const handleCreateAnother = () => {
    resetForm();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (shareableLink) {
              router.replace('/(tabs)/groups');
            } else {
              router.back();
            }
          }}
        >
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>
            {shareableLink ? 'Group Created' : 'Create New Group'}
          </Text>
          <Text style={styles.subtitle}>
            {shareableLink ? 'Share with your group members' : `${remainingGroups} groups remaining today`}
          </Text>
        </View>
      </View>

      {/* Limit Warning */}
      {!canCreateGroup && !shareableLink && (
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

      {shareableLink ? (
        <View style={styles.linkContainer}>
          <View style={styles.linkCard}>
            <View style={styles.linkHeader}>
              <Link size={24} color="#4f46e5" />
              <Text style={styles.linkTitle}>Group Invite Link</Text>
            </View>
            <Text style={styles.linkText} selectable={true}>
              {shareableLink}
            </Text>
            
            <View style={styles.linkButtons}>
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={handleCopyLink}
              >
                <Link size={18} color="#4f46e5" />
                <Text style={styles.linkButtonText}>Copy Link</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.linkButton, styles.shareButton]}
                onPress={handleShareLink}
              >
                <Share2 size={18} color="#ffffff" />
                <Text style={[styles.linkButtonText, styles.shareButtonText]}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.nextSteps}>
            <Text style={styles.nextStepsTitle}>Next Steps</Text>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Share this link with your group members</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Members join by clicking the link</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Start adding expenses to your group</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.primaryActionButton}
              onPress={handleGoToGroup}
            >
              <Users size={20} color="#ffffff" />
              <Text style={styles.primaryActionButtonText}>Go to Group</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryActionButton}
              onPress={handleCreateAnother}
            >
              <Plus size={20} color="#4f46e5" />
              <Text style={styles.secondaryActionButtonText}>Create Another Group</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
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
              <Text style={styles.label}>Members</Text>
              <TouchableOpacity style={styles.addButton} onPress={addMember}>
                <Plus size={16} color="#4f46e5" />
                <Text style={styles.addButtonText}>Add Member</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.optionalHint}>
              Optional - You can add members now or later
            </Text>

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
              {members.some(m => m.trim()) && (
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
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {!shareableLink && (
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
      )}

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
  optionalHint: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
    fontStyle: 'italic',
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
  // Link sharing styles
  linkContainer: {
    flex: 1,
    padding: 20,
  },
  linkCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  linkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  linkTitle: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  linkText: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 20,
  },
  linkButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  linkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  shareButton: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  linkButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#4f46e5',
  },
  shareButtonText: {
    color: '#ffffff',
  },
  nextSteps: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    backgroundColor: '#e0e7ff',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#4f46e5',
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  actionButtons: {
    gap: 12,
  },
  primaryActionButton: {
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
  primaryActionButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryActionButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  secondaryActionButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#4f46e5',
  },
});