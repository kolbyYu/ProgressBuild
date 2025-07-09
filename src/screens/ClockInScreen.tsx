import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ListRenderItem, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { apiService } from '../services/api';
import { AttendanceRecordResponse } from '../types';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const ClockInScreen = () => {
  const [records, setRecords] = useState<AttendanceRecordResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const fetchRecords = async () => {
    setRefreshing(true);
    try {
      const res = await apiService.getAttendanceRecords();
      if (res.success) {
        setRecords(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      return result === RESULTS.GRANTED;
    }
    return true; // iOS permissions are handled differently
  };

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position: any) => {
          console.log('Location obtained:', position.coords);
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCurrentLocation(location);
          resolve(location);
        },
        (error: any) => {
          console.error('Location error:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          
          // Check if we're in development mode and using simulator/emulator
          if (__DEV__ && (
            (Platform.OS === 'ios' && error.code === 3) || 
            (Platform.OS === 'android' && (error.code === 2 || error.code === 3))
          )) {
            console.log(`Using fallback location for ${Platform.OS} Simulator/Emulator`);
            // Use Auckland, New Zealand coordinates as fallback for testing
            const fallbackLocation = {
              latitude: -43.5179925,  // Auckland latitude
              longitude: 172.6014236, // Auckland longitude
            };
            setCurrentLocation(fallbackLocation);
            resolve(fallbackLocation);
            return;
          }
          
          // Provide more specific error messages
          let errorMessage = 'Failed to get location. ';
          switch (error.code) {
            case 1:
              errorMessage += 'Location access denied.';
              break;
            case 2:
              errorMessage += 'Location unavailable.';
              break;
            case 3:
              errorMessage += 'Location request timed out.';
              break;
            default:
              errorMessage += 'Unknown location error.';
          }
          
          if (__DEV__) {
            if (Platform.OS === 'ios') {
              errorMessage += ' If using iOS Simulator, please set a custom location in Xcode (Debug → Simulate Location) or the app will use a fallback Auckland location.';
            } else if (Platform.OS === 'android') {
              errorMessage += ' If using Android Emulator, please enable location services and set a custom location in the emulator settings, or the app will use a fallback Auckland location.';
            }
          }
          
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  };

  const handleClock = async (type: 0 | 1) => {
    setLoading(true);
    
    try {
      // Request location permission
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Location permission is required for attendance tracking.');
        setLoading(false);
        return;
      }

      // Get current location
      const location = await getCurrentLocation();
      
      const res = await apiService.clockAttendance({
        attendanceType: type,
        attendanceLat: location.latitude,
        attendanceLng: location.longitude,
      });
      
      if (res.success) {
        Alert.alert('Success', type === 0 ? 'Clock In successful' : 'Clock Out successful');
        fetchRecords();
      } else {
        // Show specific error message from API response
        const errorMessage = res.message || res.error || 'Failed to clock in/out';
        Alert.alert('Error', errorMessage);
        console.log('🚨 Clock attendance failed:', {
          success: res.success,
          message: res.message,
          error: res.error,
          data: res.data
        });
      }
    } catch (error) {
      console.error('Clock error:', error);
      
      let errorTitle = 'Error';
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      // Check if this is a location error
      if (error instanceof Error && error.message.includes('location')) {
        errorTitle = 'Location Error';
        errorMessage = 'Failed to get location. Please ensure location services are enabled and try again.';
        
        // Provide helpful message for simulator/emulator users
        if (__DEV__) {
          if (Platform.OS === 'ios') {
            errorMessage = 'Failed to get location. If using iOS Simulator, please set a custom location in Xcode (Debug → Simulate Location → Custom Location) or use a physical device for testing.';
          } else if (Platform.OS === 'android') {
            errorMessage = 'Failed to get location. If using Android Emulator, please set location in emulator settings (⋮ → Location) or use a physical device for testing.';
          }
        }
      } else {
        // This is likely an API error or network error
        errorTitle = 'Network Error';
        errorMessage = error instanceof Error ? error.message : 'Failed to connect to server. Please check your internet connection and try again.';
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderItem: ListRenderItem<AttendanceRecordResponse> = ({ item }) => (
    <View style={styles.recordItem}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordType}>{item.attendanceType === 0 ? 'Clock In' : 'Clock Out'}</Text>
        <Text style={styles.recordTime}>{new Date(item.attendanceTime).toLocaleTimeString()}</Text>
      </View>
      <Text style={styles.recordProject}>
        {item.estimateInfo?.description || item.estimateInfo?.refNO || 'Unknown Project'}
      </Text>
      <Text style={styles.recordAddress}>{item.estimateInfo?.address || 'No address'}</Text>
      <Text style={styles.recordStatus}>{item.isIn === 1 ? 'In Range' : 'Out of Range'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clock In / Out</Text>
      {__DEV__ && currentLocation && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Debug Info - Current Location:
          </Text>
          <Text style={styles.debugText}>
            Lat: {currentLocation.latitude.toFixed(6)}
          </Text>
          <Text style={styles.debugText}>
            Lng: {currentLocation.longitude.toFixed(6)}
          </Text>
          {currentLocation.latitude === -36.8485 && currentLocation.longitude === 174.7633 && (
            <Text style={[styles.debugText, { color: '#FF9800', fontWeight: 'bold' }]}>
              Using fallback Auckland location ({Platform.OS.toUpperCase()} Simulator/Emulator)
            </Text>
          )}
        </View>
      )}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, { backgroundColor: loading ? '#ccc' : '#2196F3' }]} onPress={() => handleClock(0)} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Getting Location...' : 'Clock In'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: loading ? '#ccc' : '#4CAF50' }]} onPress={() => handleClock(1)} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Getting Location...' : 'Clock Out'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Today Records</Text>
      <FlatList
        data={records}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={fetchRecords}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888' }}>No records today</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  recordItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordType: {
    fontWeight: 'bold',
    color: '#2196F3',
    fontSize: 16,
  },
  recordTime: {
    color: '#333',
    fontSize: 14,
  },
  recordProject: {
    fontWeight: '600',
    color: '#333',
    fontSize: 14,
    marginBottom: 4,
  },
  recordAddress: {
    color: '#666',
    fontSize: 12,
    marginBottom: 8,
  },
  recordStatus: {
    color: '#888',
    fontSize: 12,
    textAlign: 'right',
  },
  debugInfo: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  debugText: {
    color: '#333',
    fontSize: 14,
  },
});

export default ClockInScreen; 