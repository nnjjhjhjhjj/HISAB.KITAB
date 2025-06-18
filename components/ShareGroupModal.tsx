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
  ScrollView,
} from 'react-native';
import {
  X,
  Share2,
  Copy,
  Link as LinkIcon,
  QrCode,
  Mail,
  MessageCircle,
} from 'lucide-react-native';

interface Group {
  id: string;
  name: string;
  inviteCode?: string;
  inviteLink?: string;
}

interface ShareGroupModalProps {
  visible: boolean;
  onClose: () => void;
  group: Group;
}

export default function ShareGroupModal({ visible, onClose, group }: ShareGroupModalProps) {
  const [customMessage, setCustomMessage] = useState('');
  
  // Use the Railway domain for share links
  const APP_DOMAIN = 'splitsaathi.up.railway.app';
  const shareUrl = group.inviteLink || `https://${APP_DOMAIN}/join/${group.id}`;
  const inviteCode = group.inviteCode || 'N/A';
  const defaultMessage = `Join "${group.name}" on SplitSaathi to split expenses together! 

Use invite code: ${inviteCode}
Or click the invite link: ${shareUrl}

Download SplitSaathi from your app store to get started!`;

  const handleCopy = async (text: string, label: string) => {
    try {
      // For web, use the Clipboard API
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for React Native
        const Clipboard = require('@react-native-clipboard/clipboard').default;
        Clipboard.setString(text);
      }
      Alert.alert('Copied!', `${label} copied to clipboard`);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const handleShare = async () => {
    try {
      const message = customMessage.trim() || defaultMessage;
      await Share.share({
        message: message,
        url: shareUrl,
        title: `Join ${group.name} on SplitSaathi`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share');
    }
  };

  const handleEmailShare = () => {
    const subject = `Join "${group.name}" on SplitSaathi`;
    const body = customMessage.trim() || defaultMessage;
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Alert.alert('Email Share', 'This would open your email app with the invite message');
  };

  const handleSMS = () => {
    const message = encodeURIComponent(customMessage || defaultMessage);
    Alert.alert('SMS Share', 'This would open your SMS app with the invite message');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Share Group</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Group Name</Text>
          <Text style={styles.value}>{group.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Invite Code</Text>
          <View style={styles.row}>
            <Text style={styles.value}>{inviteCode}</Text>
            <TouchableOpacity onPress={() => handleCopy(inviteCode, 'Invite code')}>
              <Copy size={20} color="#4f46e5" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Invite Link</Text>
          <View style={styles.row}>
            <Text style={styles.link} numberOfLines={1}>{shareUrl}</Text>
            <TouchableOpacity onPress={() => handleCopy(shareUrl, 'Invite link')}>
              <Copy size={20} color="#4f46e5" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Custom Message</Text>
          <TextInput
            style={styles.input}
            multiline
            numberOfLines={4}
            placeholder="Optional message to include in share"
            value={customMessage}
            onChangeText={setCustomMessage}
          />
        </View>

        <View style={styles.shareOptions}>
          <TouchableOpacity style={styles.shareOption} onPress={handleShare}>
            <View style={styles.shareIconContainer}>
              <Share2 size={24} color="#4f46e5" />
            </View>
            <Text style={styles.shareOptionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareOption} onPress={handleEmailShare}>
            <View style={styles.shareIconContainer}>
              <Mail size={24} color="#10b981" />
            </View>
            <Text style={styles.shareOptionText}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareOption} onPress={handleSMS}>
            <View style={styles.shareIconContainer}>
              <MessageCircle size={24} color="#f59e0b" />
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

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How to Join</Text>
          <Text style={styles.instructionsText}>
            1. Visit splitsaathi.up.railway.app or download the SplitSaathi app{'\n'}
            2. Create an account or sign in{'\n'}
            3. Tap "Join Group" and enter the invite code{'\n'}
            4. Start splitting expenses together!
          </Text>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  link: {
    fontSize: 14,
    color: '#4f46e5',
    flex: 1,
    marginRight: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#111827',
    backgroundColor: '#f8fafc',
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 24,
    paddingVertical: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  shareOption: {
    alignItems: 'center',
  },
  shareIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shareOptionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  instructionsCard: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});