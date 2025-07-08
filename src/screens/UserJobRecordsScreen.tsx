import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { apiService } from '../services/api';

interface JobRecordPhoto {
  id: number;
  jobRecordId: number;
  url: string;
  createTime: Date;
}

interface UserJobRecord {
  id: number;
  adminId?: number;
  jobId: number;
  beginTime: Date;
  endTime: Date;
  recordDescription: string;
  createTime: Date;
  updateTime: Date;
  workHours: number;
  adminRealName?: string;
  itemDescription?: string;
  photos: JobRecordPhoto[];
}

interface PagedUserJobRecordsResponse {
  success: boolean;
  data?: UserJobRecord[];
  message?: string;
  total?: number;
  page?: number;
  pageSize?: number;
}

const UserJobRecordsScreen = () => {
  const navigation = useNavigation();

  // State
  const [records, setRecords] = useState<UserJobRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    fetchUserJobRecords(1, true);
  }, []);

  const fetchUserJobRecords = async (page: number = 1, reset: boolean = false) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const response = await apiService.getUserJobRecords(page, pageSize);
      
      console.log('📦 User Job Records Response:', response);
      
      if (response.success && response.data && Array.isArray(response.data)) {
        const newRecords = response.data;
        
        if (reset || page === 1) {
          setRecords(newRecords);
        } else {
          setRecords(prevRecords => [...prevRecords, ...newRecords]);
        }
        
        // Update pagination info
        setCurrentPage(page);
        setTotalRecords(response.total || 0);
        
        // Calculate if there's more data
        const totalPages = Math.ceil((response.total || 0) / pageSize);
        setHasMoreData(page < totalPages);
      } else {
        if (reset || page === 1) {
          setRecords([]);
        }
        setHasMoreData(false);
      }
    } catch (error) {
      console.error('❌ User Job Records Fetch Error:', error);
      Alert.alert('Error', 'Failed to load job records');
      if (reset || page === 1) {
        setRecords([]);
      }
      setHasMoreData(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMoreData) {
      const nextPage = currentPage + 1;
      fetchUserJobRecords(nextPage, false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMoreData(true);
    fetchUserJobRecords(1, true);
  };

  const formatDateTime = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatTime = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatHours = (hours: number) => {
    if (hours === 0) return '0 hours';
    if (hours < 1) return `${Math.round(hours * 60)} minutes`;
    return `${hours.toFixed(1)} hours`;
  };

  const renderRecordItem = ({ item }: { item: UserJobRecord }) => (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View style={styles.jobInfo}>
          <Ionicons name="briefcase-outline" size={16} color="#666" />
          <View style={styles.jobDetails}>
            {item.itemDescription && (
              <Text style={styles.jobDescription}>{item.itemDescription}</Text>
            )}
          </View>
        </View>
        <Text style={styles.workHours}>{formatHours(item.workHours)}</Text>
      </View>
      
      <View style={styles.recordContent}>
        <View style={styles.timeInfo}>
          <View style={styles.timeRow}>
            <Ionicons name="play-outline" size={14} color="#4CAF50" />
            <Text style={styles.timeLabel}>Start:</Text>
            <Text style={styles.timeValue}>{formatTime(item.beginTime)}</Text>
          </View>
          <View style={styles.timeRow}>
            <Ionicons name="stop-outline" size={14} color="#F44336" />
            <Text style={styles.timeLabel}>End:</Text>
            <Text style={styles.timeValue}>{formatTime(item.endTime)}</Text>
          </View>
        </View>
        
        {item.recordDescription && (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionLabel}>Description:</Text>
            <Text style={styles.descriptionText}>{item.recordDescription}</Text>
          </View>
        )}

        {item.photos && item.photos.length > 0 && (
          <View style={styles.photosSection}>
            <Text style={styles.photosLabel}>Photos ({item.photos.length}):</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.photosScrollView}
              contentContainerStyle={styles.photosContainer}
            >
              {item.photos.map((photo, index) => (
                <TouchableOpacity key={photo.id} style={styles.photoWrapper}>
                  <Image
                    source={{ uri: photo.url }}
                    style={styles.photoImage}
                    resizeMode="cover"
                    onError={(error) => {
                      console.log('Image load error:', error.nativeEvent.error);
                    }}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
      
      <View style={styles.recordFooter}>
        <Text style={styles.createDate}>
          Created: {formatDateTime(item.createTime)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>My Work Hours</Text>
          <Text style={styles.subtitle}>Your submitted work records</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Records Summary</Text>
          <Text style={styles.summaryText}>
            {totalRecords > 0 ? `${records.length} of ${totalRecords}` : `${records.length} record${records.length !== 1 ? 's' : ''}`}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Loading records...</Text>
          </View>
        ) : records.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No work records found</Text>
            <Text style={styles.emptySubtext}>
              Your work records will appear here once you start adding them
            </Text>
          </View>
        ) : (
          <FlatList
            data={records}
            renderItem={renderRecordItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.recordsList}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            ListFooterComponent={() => {
              if (loadingMore) {
                return (
                  <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator size="small" color="#2196F3" />
                    <Text style={styles.loadingMoreText}>Loading more...</Text>
                  </View>
                );
              }
              if (!hasMoreData && records.length > 0) {
                return (
                  <View style={styles.endOfListContainer}>
                    <Text style={styles.endOfListText}>No more records to load</Text>
                  </View>
                );
              }
              return null;
            }}
          />
        )}
      </View>
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
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recordsList: {
    paddingBottom: 20,
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  jobDetails: {
    marginLeft: 6,
    flex: 1,
  },
  jobId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  jobDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    lineHeight: 18,
  },
  workHours: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recordContent: {
    marginBottom: 12,
  },
  timeInfo: {
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    marginRight: 8,
    minWidth: 40,
  },
  timeValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  descriptionSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginBottom: 12,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  photosSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  photosLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  photosScrollView: {
    marginTop: 4,
  },
  photosContainer: {
    paddingHorizontal: 4,
  },
  photoWrapper: {
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  photoImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  recordFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  createDate: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  endOfListContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  endOfListText: {
    fontSize: 14,
    color: '#666',
  },
});

export default UserJobRecordsScreen;