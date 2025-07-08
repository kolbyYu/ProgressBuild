import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';

type JobScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Job'>;

const JobScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<JobScreenNavigationProp>();

  // Check if user is Foreman (roleId: 2) or Worker (roleId: 3)
  const isForeman = user?.roleName === 'Foreman';
  const isWorker = user?.roleName === 'Worker';

  const handleNewRecord = () => {
    navigation.navigate('NewRecord');
  };

  const handleJobRecords = () => {
    navigation.navigate('JobRecords');
  };

  const handleWorkHours = () => {
    navigation.navigate('UserJobRecords');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Job Management</Text>
          <Text style={styles.subtitle}>
            {isForeman ? 'Foreman Dashboard - Manage work tasks and projects' : 'Worker Dashboard - Add work records and view tasks'}
          </Text>
          <View style={styles.roleIndicator}>
            <Ionicons 
              name={isForeman ? "person-circle" : "hammer"} 
              size={20} 
              color={isForeman ? "#FF9800" : "#4CAF50"} 
            />
            <Text style={[styles.roleText, { color: isForeman ? "#FF9800" : "#4CAF50" }]}>
              {user?.roleName || (isForeman ? 'Foreman' : 'Worker')}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Common functionality for both roles */}
          <TouchableOpacity style={styles.primaryCard} onPress={handleNewRecord}>
            <View style={styles.cardIcon}>
              <Ionicons name="add-circle" size={32} color="#4CAF50" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>New Record</Text>
              <Text style={styles.cardDescription}>
                {isForeman 
                  ? 'Add work records for assigned projects' 
                  : 'Search and add work records for projects'
                }
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          {/* Additional cards for future functionality */}
          <TouchableOpacity style={styles.card} onPress={handleWorkHours}>
            <View style={styles.cardIcon}>
              <Ionicons name="time" size={32} color="#FF9800" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Work Hours</Text>
              <Text style={styles.cardDescription}>
                View your submitted work records and hours
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>



          {/* Foreman-specific functionality */}
          {isForeman && (
            <TouchableOpacity style={styles.card} onPress={handleJobRecords}>
              <View style={styles.cardIcon}>
                <Ionicons name="list" size={32} color="#2196F3" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Job Records</Text>
                <Text style={styles.cardDescription}>
                  View all job records for your assigned projects
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#ccc" />
            </TouchableOpacity>
          )}

          

          

          
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  roleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  content: {
    padding: 20,
  },
  primaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardIcon: {
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default JobScreen; 