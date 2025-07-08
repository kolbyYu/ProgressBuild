import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { apiService } from '../services/api';
import UpdateModal from './UpdateModal';
import { VersionCheckResponse } from '../types';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
  duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onFinish, 
  duration = 10000 
}) => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;

  // Version check states
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionCheckResponse | null>(null);
  const [loadingText, setLoadingText] = useState('Loading...');

  const currentVersion = '1.0.0'; // Should match the version in AboutScreen

  useEffect(() => {
    // Start animations
    startAnimations();
    
    // Check version
    checkAppVersion();
    
    // Auto finish after duration (only if no update is required)
    const timer = setTimeout(() => {
      if (!versionInfo?.updateRequired) {
        onFinish?.();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onFinish, versionInfo?.updateRequired]);

  const checkAppVersion = async () => {
    try {
      setLoadingText('Checking for updates...');
      
      const response = await apiService.checkVersion(currentVersion);
      
      if (response.success && response.data) {
        const versionData = response.data;
        
        if (!versionData.isLatest) {
          // Update available
          setVersionInfo(versionData);
          setShowUpdateModal(true);
          setLoadingText('Update available');
        } else {
          // App is up to date
          setLoadingText('App is up to date');
          setTimeout(() => {
            setLoadingText('Loading...');
          }, 1000);
        }
      } else {
        // Version check failed, continue normally
        console.warn('Version check failed:', response.message);
        setLoadingText('Loading...');
      }
    } catch (error) {
      // Version check failed, continue normally
      console.error('Version check error:', error);
      setLoadingText('Loading...');
    }
  };

  const handleUpdateSkip = () => {
    setShowUpdateModal(false);
    // Continue app loading
    setTimeout(() => {
      onFinish?.();
    }, 500);
  };

  const handleUpdate = () => {
    setShowUpdateModal(false);
    setLoadingText('Redirecting to update...');
    // Don't call onFinish() here as user is going to update
  };

  const startAnimations = () => {
    // Logo animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Title animation (delayed)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, 400);

    // Subtitle animation (delayed)
    setTimeout(() => {
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 800);

    // Loading animation (delayed)
    setTimeout(() => {
      Animated.timing(loadingOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 1200);
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.gradientOverlay1} />
        <View style={styles.gradientOverlay2} />
        <View style={styles.content}>
          {/* Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <View style={styles.logoBackground}>
              <Image
                source={require('../assets/images/app-icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* App Title */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              },
            ]}
          >
            <Text style={styles.appTitle}>ProgressBuild</Text>
            <Text style={styles.appSubtitle}>Construction Management</Text>
          </Animated.View>

          {/* Subtitle */}
          <Animated.View
            style={[
              styles.subtitleContainer,
              {
                opacity: subtitleOpacity,
              },
            ]}
          >
            <Text style={styles.subtitle}>Professional Construction Solutions</Text>
          </Animated.View>
        </View>

        {/* Loading Indicator */}
        <Animated.View
          style={[
            styles.loadingContainer,
            {
              opacity: loadingOpacity,
            },
          ]}
        >
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>{loadingText}</Text>
        </Animated.View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version {currentVersion}</Text>
        </View>
      </View>

      {/* Update Modal */}
      {versionInfo && (
        <UpdateModal
          visible={showUpdateModal}
          versionInfo={versionInfo}
          onSkip={!versionInfo.updateRequired ? handleUpdateSkip : undefined}
          onUpdate={handleUpdate}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e3c72',
    overflow: 'hidden',
  },
  gradientOverlay1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2a5298',
    opacity: 0.7,
  },
  gradientOverlay2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#3498db',
    opacity: 0.3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoBackground: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 80,
    height: 80,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appSubtitle: {
    fontSize: 18,
    fontWeight: '300',
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitleContainer: {
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.8,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 120,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
  },
  versionContainer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.7,
  },
});

export default SplashScreen; 