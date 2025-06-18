import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import { X, Share2, Copy, Link, QrCode, Mail, MessageCircle } from 'lucide-react-native';

interface ShareGroupModalProps {
  visible: boolean;
  onClose: () => void;
  group: {
    id: string;
    name: string;
    inviteCode?: string;
    inviteLink?: string;
  };
}

export default function ShareGroupModal({ visible, onClose, group }: ShareGroupModalProps) {
  const [customMessage, setCustomMessage] = useState('');
  
  // Use a proper app domain - you should replace this with your actual domain
  const APP_DOMAIN = 'hisabkitab.app'; // Replace with your actual domain
  const shareUrl = group.inviteLink || `https://${APP_DOMAIN}/join/${group.id}`;
  const inviteCode = group.inviteCode || 'N/A';
  const defaultMessage = `Join "${group.name}" on Hisab Kitab to split expenses together! 

Use invite code: ${inviteCode} 
Or click: ${shareUrl}

Download Hisab Kitab from your app store to get started!`;

  const handleCopyLink = async () => {
    try {
      await Clipboard.setString(shareUrl);
      Alert.alert('Copied!', 'Invite link copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  const handleCopyCode = async () => {
    try {
      await Clipboard.setString(inviteCode);
      Alert.alert('Copied!', 'Invite code copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy code');
    }
  };

  const handleShare = async () => {
    try {
      const message = customMessage.trim() || defaultMessage;
      await Share.share({
        message: message,
        url: shareUrl,
        title: `Join ${group.name} on Hisab Kitab`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share');
    }
  };

  const handleEmailShare = () => {
    const subject = `Join "${group.name}" on Hisab Kitab`;
    const body = customMessage.trim() || defaultMessage;
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // In a real app, you would use Linking.openURL(emailUrl)
    Alert.alert('Email Share', 'This would open your email app with the invite message');
  };

  const handleSMSShare = () => {
    const message = customMessage.trim() || defaultMessage;
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    
    // In a real app, you would use Linking.openURL(smsUrl)
    Alert.alert('SMS Share', 'This would open your messaging app with the invite message');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Share Group</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Group Info */}
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupSubtitle}>Invite others to join your group</Text>
          </View>

          {/* Invite Code */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Invite Code</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.inviteCode}>{inviteCode}</Text>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
                <Copy size={16} color="#2563eb" />
              </TouchableOpacity>
            </View>
            <Text style={styles.codeDescription}>
              Share this code with friends to let them join your group
            </Text>
          </View>

          {/* Invite Link */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Invite Link</Text>
            <View style={styles.linkContainer}>
              <Text style={styles.inviteLink} numberOfLines={1}>{shareUrl}</Text>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
                <Copy size={16} color="#2563eb" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Custom Message */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Custom Message (Optional)</Text>
            <TextInput
              style={styles.messageInput}
              value={customMessage}
              onChangeText={setCustomMessage}
              placeholder={defaultMessage}
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          {/* Share Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Share Via</Text>
            <View style={styles.shareOptions}>
              <TouchableOpacity style={styles.shareOption} onPress={handleShare}>
                <View style={styles.shareIconContainer}>
                  <Share2 size={24} color="#2563eb" />
                </View>
                <Text style={styles.shareOptionText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareOption} onPress={handleEmailShare}>
                <View style={styles.shareIconContainer}>
                  <Mail size={24} color="#059669" />
                </View>
                <Text style={styles.shareOptionText}>Email</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareOption} onPress={handleSMSShare}>
                <View style={styles.shareIconContainer}>
                  <MessageCircle size={24} color="#ea580c" />
                </View>
                <Text style={styles.shareOptionText}>SMS</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.shareOption} 
                onPress={() => Alert.alert('QR Code', 'QR code sharing would be implemented here')}
              >
                <View style={styles.shareIconContainer}>
                  <QrCode size={24} color="#7c3aed" />
                </View>
                <Text style={styles.shareOptionText}>QR Code</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>How to Join</Text>
            <Text style={styles.instructionsText}>
              1. Download Hisab Kitab app from your app store{'\n'}
              2. Create an account or sign in{'\n'}
              3. Tap "Join Group" and enter the invite code{'\n'}
              4. Start splitting expenses together!
            </Text>
          </View>
        </View>
      </View>
    </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  groupInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  groupSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inviteCode: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#2563eb',
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  codeDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inviteLink: {
    flex: 1,
    fontSize: 14,
    color: '#2563eb',
    marginRight: 8,
  },
  messageInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  shareOption: {
    alignItems: 'center',
    flex: 1,
  },
  shareIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  shareOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  instructionsCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18,
  },
});