import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AboutScreen = () => {
  const navigation = useNavigation();

  const appVersion = '1.0.0';
  const buildNumber = '2025.01.15';

  const legalItems = [
    {
      icon: 'document-text',
      title: 'Terms of Service',
      subtitle: 'Our terms and conditions',
      onPress: () => Linking.openURL('https://www.progressbuild.co.nz/terms')
    },
    {
      icon: 'shield-checkmark',
      title: 'Privacy Policy',
      subtitle: 'How we protect your data',
      onPress: () => Linking.openURL('https://www.progressbuild.co.nz/privacy')
    },
    {
      icon: 'information-circle',
      title: 'Legal Information',
      subtitle: 'Copyright and trademark info',
      onPress: () => Alert.alert('Legal Information', '© 2025 ProgressBuild Construction. All rights reserved.')
    }
  ];



  const LegalItem = ({ icon, title, subtitle, onPress }: {
    icon: string;
    title: string;
    subtitle: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.legalItem} onPress={onPress}>
      <View style={styles.legalIcon}>
        <Ionicons name={icon as any} size={24} color="#2196F3" />
      </View>
      <View style={styles.legalContent}>
        <Text style={styles.legalTitle}>{title}</Text>
        <Text style={styles.legalSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );



  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>About</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo and Name */}
        <View style={styles.appSection}>
          <View style={styles.appIcon}>
            <Image
              source={require('../assets/images/app-icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>ProgressBuild</Text>
          <Text style={styles.appTagline}>Construction Progress Management</Text>
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Version {appVersion}</Text>
            <Text style={styles.buildText}>Build {buildNumber}</Text>
          </View>
        </View>



        {/* Legal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal Information</Text>
          
          {legalItems.map((item, index) => (
            <LegalItem key={index} {...item} />
          ))}
        </View>

        {/* Copyright */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightText}>
            © 2025 ProgressBuild Construction{'\n'}
            All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  appSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  versionContainer: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  buildText: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },

  legalItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 2,
  },
  legalIcon: {
    width: 40,
    alignItems: 'center',
  },
  legalContent: {
    flex: 1,
    marginLeft: 12,
  },
  legalTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  legalSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  copyrightSection: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AboutScreen; 