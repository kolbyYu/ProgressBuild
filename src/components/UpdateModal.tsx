import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { VersionCheckResponse } from '../types';

interface UpdateModalProps {
  visible: boolean;
  versionInfo: VersionCheckResponse;
  onSkip?: () => void;
  onUpdate: () => void;
}

const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  versionInfo,
  onSkip,
  onUpdate,
}) => {
  const handleUpdate = () => {
    if (versionInfo.updateUrl) {
      Linking.openURL(versionInfo.updateUrl).catch(err => {
        console.error('Failed to open update URL:', err);
        Alert.alert('Error', 'Failed to open update link');
      });
    }
    onUpdate();
  };

  const handleSkip = () => {
    if (versionInfo.updateRequired) {
      Alert.alert(
        'Update Required',
        'This update is required to continue using the app.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
      return;
    }
    onSkip?.();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="cloud-download" size={32} color="#2196F3" />
            </View>
            <Text style={styles.title}>Update Available</Text>
            <Text style={styles.versionText}>
              Version {versionInfo.latestVersion}
            </Text>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {versionInfo.updateMessage && (
              <View style={styles.messageContainer}>
                <Text style={styles.messageText}>{versionInfo.updateMessage}</Text>
              </View>
            )}

            <View style={styles.versionInfo}>
              <View style={styles.versionItem}>
                <Text style={styles.versionLabel}>Current Version:</Text>
                <Text style={styles.versionValue}>{versionInfo.currentVersion}</Text>
              </View>
              <View style={styles.versionItem}>
                <Text style={styles.versionLabel}>Latest Version:</Text>
                <Text style={[styles.versionValue, styles.latestVersion]}>
                  {versionInfo.latestVersion}
                </Text>
              </View>
            </View>

            {versionInfo.releaseNotes && (
              <View style={styles.releaseNotesContainer}>
                <Text style={styles.releaseNotesTitle}>What's New:</Text>
                <Text style={styles.releaseNotes}>{versionInfo.releaseNotes}</Text>
              </View>
            )}

            {versionInfo.updateRequired && (
              <View style={styles.requiredNotice}>
                <Ionicons name="warning" size={20} color="#ff4444" />
                <Text style={styles.requiredText}>
                  This update is required to continue using the app
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            {!versionInfo.updateRequired && onSkip && (
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.updateButton, 
                versionInfo.updateRequired && styles.updateButtonFull
              ]} 
              onPress={handleUpdate}
            >
              <Ionicons name="download" size={20} color="#fff" />
              <Text style={styles.updateButtonText}>
                {versionInfo.updateRequired ? 'Update Now' : 'Update'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    maxHeight: 300,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    textAlign: 'center',
  },
  versionInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  versionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  versionLabel: {
    fontSize: 14,
    color: '#666',
  },
  versionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  latestVersion: {
    color: '#2196F3',
  },
  releaseNotesContainer: {
    marginBottom: 16,
  },
  releaseNotesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  releaseNotes: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  requiredNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  requiredText: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  updateButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  updateButtonFull: {
    flex: 2,
  },
  updateButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default UpdateModal; 