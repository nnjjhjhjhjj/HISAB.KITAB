import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Heart, 
  Star, 
  Globe, 
  Mail, 
  Shield, 
  Users,
  Zap,
  Award,
  Coffee
} from 'lucide-react-native';

export default function AboutScreen() {
  const handleWebsite = () => {
    Linking.openURL('https://splitwise.com');
  };

  const handlePrivacy = () => {
    Linking.openURL('https://splitwise.com/privacy');
  };

  const handleTerms = () => {
    Linking.openURL('https://splitwise.com/terms');
  };

  const handleSupport = () => {
    Linking.openURL('mailto:support@splitwise.com');
  };

  const renderFeatureItem = (icon: React.ReactNode, title: string, description: string) => (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        {icon}
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
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
        <Text style={styles.title}>About SplitWise</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo and Info */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Users size={48} color="#2563eb" />
          </View>
          <Text style={styles.appName}>SplitWise</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.tagline}>
            The easiest way to split expenses with friends and family
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Do</Text>
          <View style={styles.featuresContainer}>
            {renderFeatureItem(
              <Zap size={24} color="#2563eb" />,
              'Easy Expense Tracking',
              'Add expenses in seconds and split them fairly among group members'
            )}
            {renderFeatureItem(
              <Users size={24} color="#059669" />,
              'Group Management',
              'Create groups for different occasions - trips, roommates, or regular outings'
            )}
            {renderFeatureItem(
              <Award size={24} color="#ea580c" />,
              'Smart Balances',
              'Automatically calculate who owes what and settle up easily'
            )}
            {renderFeatureItem(
              <Shield size={24} color="#7c3aed" />,
              'Secure & Private',
              'Your data is encrypted and secure. We never share your information'
            )}
          </View>
        </View>

        {/* Mission */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <View style={styles.missionCard}>
            <Heart size={32} color="#dc2626" style={styles.missionIcon} />
            <Text style={styles.missionText}>
              We believe that money shouldn't come between friends. SplitWise makes it easy to 
              share expenses and keep track of balances, so you can focus on making memories 
              instead of doing math.
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By the Numbers</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>1M+</Text>
              <Text style={styles.statLabel}>Happy Users</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>50M+</Text>
              <Text style={styles.statLabel}>Expenses Split</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>$2B+</Text>
              <Text style={styles.statLabel}>Money Managed</Text>
            </View>
          </View>
        </View>

        {/* Team */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Made with Love</Text>
          <View style={styles.teamCard}>
            <Coffee size={24} color="#92400e" />
            <Text style={styles.teamText}>
              Built by a passionate team of developers who understand the pain of splitting 
              bills and wanted to make it easier for everyone.
            </Text>
          </View>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learn More</Text>
          <View style={styles.linksContainer}>
            <TouchableOpacity style={styles.linkItem} onPress={handleWebsite}>
              <Globe size={20} color="#6b7280" />
              <Text style={styles.linkText}>Visit our website</Text>
              <ArrowLeft size={16} color="#9ca3af" style={styles.linkArrow} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.linkItem} onPress={handleSupport}>
              <Mail size={20} color="#6b7280" />
              <Text style={styles.linkText}>Contact support</Text>
              <ArrowLeft size={16} color="#9ca3af" style={styles.linkArrow} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.linkItem} onPress={handlePrivacy}>
              <Shield size={20} color="#6b7280" />
              <Text style={styles.linkText}>Privacy policy</Text>
              <ArrowLeft size={16} color="#9ca3af" style={styles.linkArrow} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.linkItem} onPress={handleTerms}>
              <Star size={20} color="#6b7280" />
              <Text style={styles.linkText}>Terms of service</Text>
              <ArrowLeft size={16} color="#9ca3af" style={styles.linkArrow} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Copyright */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightText}>
            © 2024 SplitWise. All rights reserved.
          </Text>
          <Text style={styles.copyrightSubtext}>
            Made with ❤️ for expense sharing
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
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  version: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  featuresContainer: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  missionCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  missionIcon: {
    marginBottom: 12,
  },
  missionText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
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
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  teamCard: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  teamText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  linksContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  linkText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
  },
  linkArrow: {
    transform: [{ rotate: '180deg' }],
  },
  copyrightSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 20,
  },
  copyrightText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  copyrightSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
});