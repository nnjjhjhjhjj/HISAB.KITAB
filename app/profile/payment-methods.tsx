import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, CreditCard, Plus, Trash2, Star, Shield, Smartphone, Building, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'digital';
  name: string;
  details: string;
  isDefault: boolean;
  icon: React.ReactNode;
}

export default function PaymentMethodsScreen() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      name: 'Visa ending in 4242',
      details: 'Expires 12/25',
      isDefault: true,
      icon: <CreditCard size={20} color="#1a365d" />
    },
    {
      id: '2',
      type: 'digital',
      name: 'PayPal',
      details: 'john@example.com',
      isDefault: false,
      icon: <Smartphone size={20} color="#0070ba" />
    },
    {
      id: '3',
      type: 'bank',
      name: 'Bank Account',
      details: 'Chase ****1234',
      isDefault: false,
      icon: <Building size={20} color="#2d3748" />
    }
  ]);

  const handleAddPaymentMethod = () => {
    Alert.alert(
      'Add Payment Method',
      'Choose a payment method to add',
      [
        { text: 'Credit/Debit Card', onPress: () => Alert.alert('Coming Soon', 'Card setup will be available soon') },
        { text: 'Bank Account', onPress: () => Alert.alert('Coming Soon', 'Bank account setup will be available soon') },
        { text: 'Digital Wallet', onPress: () => Alert.alert('Coming Soon', 'Digital wallet setup will be available soon') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(prev => 
      prev.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
    Alert.alert('Success', 'Default payment method updated');
  };

  const handleRemovePaymentMethod = (id: string, name: string) => {
    Alert.alert(
      'Remove Payment Method',
      `Are you sure you want to remove ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(prev => prev.filter(method => method.id !== id));
            Alert.alert('Success', 'Payment method removed');
          }
        },
      ]
    );
  };

  const handleMoreOptions = (method: PaymentMethod) => {
    Alert.alert(
      method.name,
      'Choose an action',
      [
        { text: 'Set as Default', onPress: () => handleSetDefault(method.id) },
        { text: 'Edit Details', onPress: () => Alert.alert('Coming Soon', 'Edit functionality will be available soon') },
        { text: 'Remove', style: 'destructive', onPress: () => handleRemovePaymentMethod(method.id, method.name) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderPaymentMethod = (method: PaymentMethod) => (
    <View key={method.id} style={styles.paymentMethodCard}>
      <View style={styles.paymentMethodHeader}>
        <View style={styles.paymentMethodIcon}>
          {method.icon}
        </View>
        <View style={styles.paymentMethodInfo}>
          <View style={styles.paymentMethodTitleRow}>
            <Text style={styles.paymentMethodName}>{method.name}</Text>
            {method.isDefault && (
              <View style={styles.defaultBadge}>
                <Star size={12} color="#ffffff" />
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>
          <Text style={styles.paymentMethodDetails}>{method.details}</Text>
        </View>
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => handleMoreOptions(method)}
        >
          <MoreHorizontal size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Methods</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPaymentMethod}
        >
          <Plus size={20} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Shield size={24} color="#2563eb" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Secure Payment Processing</Text>
            <Text style={styles.infoText}>
              Your payment information is encrypted and secure. We never store your full card details.
            </Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Payment Methods</Text>
          <View style={styles.paymentMethodsList}>
            {paymentMethods.map(renderPaymentMethod)}
          </View>
        </View>

        {/* Add New Payment Method */}
        <TouchableOpacity 
          style={styles.addPaymentMethodCard}
          onPress={handleAddPaymentMethod}
        >
          <View style={styles.addPaymentMethodIcon}>
            <Plus size={24} color="#2563eb" />
          </View>
          <View style={styles.addPaymentMethodContent}>
            <Text style={styles.addPaymentMethodTitle}>Add Payment Method</Text>
            <Text style={styles.addPaymentMethodSubtitle}>
              Add a credit card, bank account, or digital wallet
            </Text>
          </View>
        </TouchableOpacity>

        {/* Supported Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supported Payment Methods</Text>
          <View style={styles.supportedMethodsGrid}>
            <View style={styles.supportedMethodCard}>
              <CreditCard size={24} color="#6b7280" />
              <Text style={styles.supportedMethodText}>Credit & Debit Cards</Text>
            </View>
            <View style={styles.supportedMethodCard}>
              <Building size={24} color="#6b7280" />
              <Text style={styles.supportedMethodText}>Bank Accounts</Text>
            </View>
            <View style={styles.supportedMethodCard}>
              <Smartphone size={24} color="#6b7280" />
              <Text style={styles.supportedMethodText}>Digital Wallets</Text>
            </View>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityCard}>
          <Text style={styles.securityTitle}>Security & Privacy</Text>
          <Text style={styles.securityText}>
            • All transactions are encrypted with bank-level security{'\n'}
            • We never store your full payment details{'\n'}
            • Your financial information is never shared with other users{'\n'}
            • You can remove payment methods at any time
          </Text>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  paymentMethodsList: {
    gap: 12,
  },
  paymentMethodCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 2,
  },
  paymentMethodDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  moreButton: {
    padding: 8,
  },
  addPaymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  addPaymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addPaymentMethodContent: {
    flex: 1,
  },
  addPaymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 2,
  },
  addPaymentMethodSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  supportedMethodsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  supportedMethodCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  supportedMethodText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  securityCard: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 20,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
  },
});