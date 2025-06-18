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
  Linking,
  ScrollView,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { APP_DOMAIN } from '@env';

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
  
  // Use a proper app domain - you should replace this with your actual domain
  const APP_DOMAIN = 'hisabkitab.app'; // Replace with your actual domain
  const shareUrl = group.inviteLink || `https://${APP_DOMAIN}/join/${group.id}`;
  const inviteCode = group.inviteCode || 'N/A';
  const defaultMessage = `Join "${group.name}" on Hisab Kitab to split expenses together! 

Use invite code: ${inviteCode}
Or click the invite link: ${shareUrl}

Download Hisab Kitab from your app store to get started!`;

  const handleCopy = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', `${label} copied to clipboard`);
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

  const handleSMS = () => {
    const message = encodeURIComponent(customMessage || defaultMessage);
    Linking.openURL(`sms:?body=${message}`);
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
              <Copy size={20} color="#2563eb" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Invite Link</Text>
          <View style={styles.row}>
            <Text style={styles.link} numberOfLines={1}>{shareUrl}</Text>
            <TouchableOpacity onPress={() => handleCopy(shareUrl, 'Invite link')}>
              <Copy size={20} color="#2563eb" />
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
          <TouchableOpacity style={styles.option} onPress={handleShare}>
            <Share2 size={22} color="#1d4ed8" />
            <Text style={styles.optionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={handleEmail}>
            <Mail size={22} color="#10b981" />
            <Text style={styles.optionText}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={handleSMS}>
            <MessageCircle size={22} color="#f59e0b" />
            <Text style={styles.optionText}>SMS</Text>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
  },
  section: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  link: {
    fontSize: 14,
    color: '#2563eb',
    flex: 1,
    marginRight: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#111827',
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  option: {
    alignItems: 'center',
  },
  optionText: {
    marginTop: 6,
    fontSize: 12,
    color: '#374151',
  },
});
