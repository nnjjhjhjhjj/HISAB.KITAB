import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Plus, X, ArrowLeft, Users, Smile, CheckCircle, Share2, Copy, Edit3, DollarSign, Receipt, Star, Bell, Moon, Shield, Lock, ChevronRight, Trash2, LogOut, HelpCircle, Download
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { apiService } from '@/services/api';
import { User as UserType } from '@/types';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EMOJIS = ['🎉','👫','✈️','🏖️','🍽️','🏠','🎂','🛒','��','🧑‍🤝‍🧑','🧳','🍻','🎊','🚌','🚗','🏕️','🏟️','🎮','🎵','🧗','🏋️'];

export default function AddGroupScreen() {
  const [groupName, setGroupName] = useState('');
  const [groupEmoji, setGroupEmoji] = useState('🎉');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [members, setMembers] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<any>(null);
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const confettiRef = useRef<any>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalExpenses: 0,
    totalTransactions: 0,
    monthlySpending: 0,
  });

  const addMember = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMembers([...members, '']);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMembers(members.filter((_, i) => i !== index));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const updateMember = (index: number, value: string) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
  };

  const validate = () => {
    if (!groupName.trim() || groupName.trim().length < 3) {
      setError('Group name must be at least 3 characters.');
      return false;
    }
    const validMembers = members.map(m => m.trim()).filter(Boolean);
    if (validMembers.length === 0) {
      setError('Please add at least one member.');
      return false;
    }
    const memberSet = new Set();
    for (let m of validMembers) {
      if (memberSet.has(m.toLowerCase())) {
        setError('Duplicate member names are not allowed.');
        return false;
      }
      memberSet.add(m.toLowerCase());
    }
    setError(null);
    return true;
  };

  const handleCopyLink = async () => {
    if (!shareableLink) return;
    await Clipboard.setStringAsync(shareableLink);
    Alert.alert('Copied!', 'Group invite link copied to clipboard');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleShareLink = async () => {
    if (!shareableLink) return;
    try {
      await Sharing.shareAsync(undefined, {
        dialogTitle: 'Join my group on SplitSaathi',
        mimeType: 'text/plain',
        UTI: 'public.text',
        message: `Join my expense group "${createdGroup?.name}" on SplitSaathi: ${shareableLink}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share group link');
    }
  };

  const handleCreateGroup = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const validMembers = members.map(m => m.trim()).filter(Boolean);
      const newGroup = await apiService.createGroup({
        name: groupName.trim(),
        description: '',
        members: validMembers,
        emoji: groupEmoji,
      });
      setCreatedGroup(newGroup);
      setShareableLink(newGroup.inviteLink || `https://splitsaathi.up.railway.app/join/${newGroup.id}`);
      setSuccess(true);
      setTimeout(() => confettiRef.current && confettiRef.current.start(), 400);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      let msg = 'Failed to create group. Please try again.';
      if (e?.response?.data?.message) {
        msg = e.response.data.message;
      } else if (e?.message) {
        msg = e.message;
      }
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setGroupName('');
    setMembers(['']);
    setSuccess(false);
    setCreatedGroup(null);
    setShareableLink(null);
    setError(null);
  };

  // --- Success Modal ---
  if (success && createdGroup) {
    return (
      <Modal visible={success} animationType="slide" transparent>
        <LinearGradient colors={["#f8fafc", "#e0e7ff"]} style={styles.successModalBg}>
          <View style={styles.successModalCard}>
            <ConfettiCannon
              count={80}
              origin={{x: 180, y: 0}}
              autoStart={false}
              ref={confettiRef}
              fadeOut
            />
            <View style={styles.successEmojiCircle}>
              <Text style={styles.successEmoji}>{createdGroup.emoji || groupEmoji}</Text>
            </View>
            <Text style={styles.successTitle}>Group Created!</Text>
            <Text style={styles.successGroupName}>{createdGroup.name}</Text>
            <Text style={styles.successSubtitle}>Share the invite link with your friends:</Text>
            <View style={styles.successLinkBox}>
              <Text style={styles.successLinkText} numberOfLines={1}>{shareableLink}</Text>
              <TouchableOpacity onPress={handleCopyLink} style={{marginLeft: 8}}>
                <Copy size={18} color="#6366f1" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.successShareBtn} onPress={handleShareLink}>
              <Share2 size={20} color="#fff" />
              <Text style={styles.successShareBtnText}>Share Invite</Text>
            </TouchableOpacity>
            <View style={styles.successActionsRow}>
              <TouchableOpacity style={styles.successActionSecondary} onPress={resetForm}>
                <Text style={styles.successActionSecondaryText}>Create Another</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.successActionPrimary} onPress={() => router.replace(`/group/${createdGroup.id}`)}>
                <Text style={styles.successActionPrimaryText}>Go to Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Modal>
    );
  }

  // --- Main UI ---
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#f8fafc'}}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={{flexGrow: 1}} keyboardShouldPersistTaps="handled">
          {/* Hero Header */}
          <LinearGradient colors={["#6366f1", "#a5b4fc"]} style={styles.heroHeader}>
            <TouchableOpacity style={styles.heroBackBtn} onPress={() => router.back()}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroEmojiCircle} onPress={() => setShowEmojiPicker(true)}>
              <Text style={styles.heroEmoji}>{groupEmoji}</Text>
            </TouchableOpacity>
            <Text style={styles.heroTitle}>Create a Group</Text>
            <Text style={styles.heroSubtitle}>Plan, split, and celebrate together!</Text>
          </LinearGradient>

          {/* Floating Card Form */}
          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>Group Name</Text>
            <View style={styles.inputRow}>
              <Smile size={20} color="#6366f1" style={{marginRight: 8}} />
              <TextInput
                style={styles.input}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="e.g. Goa Trip, Flatmates, Birthday Bash"
                placeholderTextColor="#a1a1aa"
                maxLength={32}
                autoCapitalize="words"
                accessible accessibilityLabel="Group Name"
              />
            </View>

            <Text style={[styles.inputLabel, {marginTop: 24}]}>Members</Text>
            <View style={styles.membersPillsRow}>
              {members.map((member, idx) => (
                <View key={idx} style={styles.memberPill}>
                  <Users size={16} color="#6366f1" style={{marginRight: 4}} />
                  <TextInput
                    style={styles.memberPillInput}
                    value={member}
                    onChangeText={v => updateMember(idx, v)}
                    placeholder={`Name`}
                    placeholderTextColor="#a1a1aa"
                    maxLength={18}
                    autoCapitalize="words"
                    accessible accessibilityLabel={`Member ${idx + 1}`}
                  />
                  {members.length > 1 && (
                    <TouchableOpacity onPress={() => removeMember(idx)} accessibilityLabel={`Remove member ${idx + 1}`}>
                      <X size={16} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addPillBtn} onPress={addMember} accessibilityLabel="Add member">
                <Plus size={18} color="#6366f1" />
              </TouchableOpacity>
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        </ScrollView>
        {/* Floating Action Button */}
        <TouchableOpacity
          style={[styles.fab, (!groupName.trim() || loading) && {opacity: 0.5}]}
          onPress={handleCreateGroup}
          disabled={!groupName.trim() || loading}
          accessibilityLabel="Create Group"
        >
          <LinearGradient colors={["#6366f1", "#4f46e5"]} style={styles.fabGradient}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.fabText}>Create Group</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* Emoji Picker Modal */}
      <Modal visible={showEmojiPicker} animationType="slide" transparent>
        <View style={styles.emojiPickerModalBg}>
          <View style={styles.emojiPickerModalCard}>
            <Text style={styles.emojiPickerTitle}>Pick a Group Emoji</Text>
            <FlatList
              data={EMOJIS}
              numColumns={5}
              keyExtractor={item => item}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[styles.emojiOption, groupEmoji === item && styles.emojiOptionSelected]}
                  onPress={() => { setGroupEmoji(item); setShowEmojiPicker(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                  accessibilityLabel={`Pick emoji ${item}`}
                >
                  <Text style={styles.emojiOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={{alignItems: 'center'}}
            />
            <TouchableOpacity style={styles.emojiPickerCloseBtn} onPress={() => setShowEmojiPicker(false)}>
              <Text style={styles.emojiPickerCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroHeader: {
    minHeight: 220,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'android' ? 48 : 32,
    paddingBottom: 32,
    position: 'relative',
  },
  heroBackBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 56 : 36,
    left: 20,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 20,
    padding: 6,
  },
  heroEmojiCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
  },
  heroEmoji: { fontSize: 36 },
  heroTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  heroSubtitle: { fontSize: 16, color: '#e0e7ff', marginTop: 4 },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: -48,
    padding: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
  },
  inputLabel: { fontSize: 16, fontWeight: '600', color: '#6366f1', marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e7ef',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#18181b',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  membersPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e7ef',
    minWidth: 80,
    maxWidth: 160,
  },
  memberPillInput: {
    flex: 1,
    fontSize: 15,
    color: '#18181b',
    paddingVertical: 2,
    backgroundColor: 'transparent',
  },
  addPillBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  fab: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 32,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#6366f1',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
  },
  fabGradient: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  // Success Modal
  successModalBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  successModalCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    width: 340,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: 8},
  },
  successEmojiCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successEmoji: { fontSize: 40 },
  successTitle: { fontSize: 26, fontWeight: 'bold', color: '#22c55e', marginTop: 8 },
  successGroupName: { fontSize: 18, fontWeight: '600', color: '#6366f1', marginTop: 2, marginBottom: 8 },
  successSubtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 16 },
  successLinkBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  successLinkText: { color: '#4f46e5', fontSize: 15 },
  successShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 18,
  },
  successShareBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  successActionsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
  },
  successActionPrimary: {
    flex: 1,
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
  },
  successActionPrimaryText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  successActionSecondary: {
    flex: 1,
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
  },
  successActionSecondaryText: { color: '#4f46e5', fontWeight: 'bold', fontSize: 16 },
  // Emoji Picker
  emojiPickerModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiPickerModalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: 320,
    alignItems: 'center',
  },
  emojiPickerTitle: { fontSize: 18, fontWeight: 'bold', color: '#6366f1', marginBottom: 16 },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  emojiOptionSelected: {
    backgroundColor: '#eef2ff',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  emojiOptionText: { fontSize: 28 },
  emojiPickerCloseBtn: {
    marginTop: 16,
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  emojiPickerCloseBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
  },
});