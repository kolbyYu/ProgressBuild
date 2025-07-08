import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { apiService } from '../services/api';
import { Estimate, JobWithHours, JobSummaryStatistics, RootStackParamList } from '../types';

const JobRecordsScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // State
  const [projects, setProjects] = useState<Estimate[]>([]);
  const [selectedProject, setSelectedProject] = useState<Estimate | null>(null);
  const [jobs, setJobs] = useState<JobWithHours[]>([]);
  const [summary, setSummary] = useState<JobSummaryStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobWithHours | null>(null);
  const [tempProgress, setTempProgress] = useState(0);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await apiService.getEstimates();
      if (response.success && response.data) {
        setProjects(response.data);
        // Auto-select the first project if available
        if (response.data.length > 0) {
          const firstProject = response.data[0];
          setSelectedProject(firstProject);
          if (firstProject.id) {
            fetchJobsWithHours(firstProject.id, 1, true);
          }
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobsWithHours = async (estimateId: number, page: number = 1, reset: boolean = false) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const response = await apiService.getJobsWithHours(estimateId, page, pageSize);
      
      // Debug logging
      console.log('📦 Jobs Response:', {
        success: response.success,
        dataType: response.data ? typeof response.data : 'undefined',
        hasJobs: response.data && response.data.jobs ? response.data.jobs.length : 'no jobs',
        hasSummary: response.data && response.data.summary ? 'yes' : 'no',
        total: response.data ? response.data.total : 'no total',
        page: response.data ? response.data.page : 'no page',
        pageSize: response.data ? response.data.pageSize : 'no pageSize',
        message: response.message
      });
      
      if (response.success && response.data && response.data.jobs) {
        const newJobs = response.data.jobs;
        const summaryData = response.data.summary;
        
        if (reset || page === 1) {
          setJobs(newJobs);
          setSummary(summaryData);
        } else {
          setJobs(prevJobs => [...prevJobs, ...newJobs]);
          // Update summary with latest data
          setSummary(summaryData);
        }
        
        // Update pagination info
        setCurrentPage(page);
        setTotalJobs(response.data.total || 0);
        
        // Calculate if there's more data
        const totalPages = Math.ceil((response.data.total || 0) / pageSize);
        setTotalPages(totalPages);
        setHasMoreData(page < totalPages);
      } else {
        console.log('❌ Jobs Response Failed:', response);
        if (reset || page === 1) {
          setJobs([]);
          setSummary(null);
        }
        setHasMoreData(false);
      }
    } catch (error) {
      console.error('❌ Jobs Fetch Error:', error);
      Alert.alert('Error', 'Failed to load jobs');
      if (reset || page === 1) {
        setJobs([]);
        setSummary(null);
      }
      setHasMoreData(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleProjectSelect = (project: Estimate) => {
    setSelectedProject(project);
    setShowProjectModal(false);
    if (project.id) {
      // Reset pagination when selecting a new project
      setCurrentPage(1);
      setHasMoreData(true);
      fetchJobsWithHours(project.id, 1, true);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMoreData && selectedProject?.id) {
      const nextPage = currentPage + 1;
      fetchJobsWithHours(selectedProject.id, nextPage, false);
    }
  };

  const handleRefresh = () => {
    if (selectedProject?.id) {
      setRefreshing(true);
      setCurrentPage(1);
      setHasMoreData(true);
      fetchJobsWithHours(selectedProject.id, 1, true);
    }
  };

  const handleProgressPress = (job: JobWithHours) => {
    setSelectedJob(job);
    setTempProgress(job.progressRate || 0);
    setShowProgressModal(true);
  };

  const handleProgressUpdate = async () => {
    if (!selectedJob) return;

    setUpdatingProgress(true);
    try {
      const response = await apiService.updateJobProgress({
        jobId: selectedJob.jobId,
        progressRate: tempProgress
      });

      if (response.success) {
        // Update the job in the local state
        setJobs(prevJobs => 
          prevJobs.map(job => 
            job.jobId === selectedJob.jobId 
              ? { ...job, progressRate: tempProgress }
              : job
          )
        );
        setShowProgressModal(false);
        Alert.alert('Success', 'Progress updated successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to update progress');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update progress');
    } finally {
      setUpdatingProgress(false);
    }
  };

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatHours = (hours: number) => {
    if (hours === 0) return '0 hours';
    if (hours < 1) return `${Math.round(hours * 60)} minutes`;
    return `${hours.toFixed(1)} hours`;
  };

  const renderProjectItem = ({ item }: { item: Estimate }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => handleProjectSelect(item)}
    >
      <Text style={styles.modalItemTitle}>{item.description || item.refNO || 'Untitled Project'}</Text>
      <Text style={styles.modalItemSubtitle}>{item.address || `ID: ${item.id}`}</Text>
    </TouchableOpacity>
  );

  const renderJobItem = ({ item }: { item: JobWithHours }) => (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{item.jobDescription}</Text>
        <TouchableOpacity 
          style={styles.progressContainer}
          onPress={() => handleProgressPress(item)}
        >
          <Text style={styles.progressText}>{item.progressRate?.toFixed(0) || 0}%</Text>
          <Ionicons name="create-outline" size={12} color="#1976d2" style={styles.editIcon} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.jobDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {formatDate(item.beginDate)} - {formatDate(item.endDate)}
          </Text>
        </View>
        
        {item.quantity && (
          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={16} color="#666" />
            <Text style={styles.detailText}>Allowed Hours: {item.quantity}</Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>Total Work: {formatHours(item.totalWorkHours)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="document-text-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.recordCount} record{item.recordCount !== 1 ? 's' : ''}</Text>
        </View>
      </View>
      
      <View style={styles.jobFooter}>
        <Text style={styles.createDate}>Created: {formatDate(item.createTime)}</Text>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => {
            navigation.navigate('JobRecordDetail', {
              jobId: item.jobId,
              jobTitle: item.jobDescription
            });
          }}
        >
          <Ionicons name="eye" size={16} color="#2196F3" />
          <Text style={styles.viewButtonText}>View Records</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Job Summary</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Project Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Project</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowProjectModal(true)}
          >
            <Text style={selectedProject ? styles.selectedText : styles.placeholderText}>
              {selectedProject ? (selectedProject.description || selectedProject.refNO || 'Untitled Project') : 'Choose a project to view jobs'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Jobs List */}
        {selectedProject && (
          <View style={styles.jobsSection}>
            <View style={styles.jobsHeader}>
              <Text style={styles.jobsTitle}>Jobs</Text>
              <Text style={styles.jobsCount}>
                {totalJobs > 0 ? `${jobs.length} of ${totalJobs}` : `${jobs.length} job${jobs.length !== 1 ? 's' : ''}`}
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>Loading jobs...</Text>
              </View>
            ) : jobs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="briefcase-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No jobs found</Text>
                <Text style={styles.emptySubtext}>
                  Jobs will appear here once they are assigned to this project
                </Text>
              </View>
            ) : (
              <FlatList
                data={jobs}
                renderItem={renderJobItem}
                keyExtractor={(item) => item.jobId.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.jobsList}
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
                  if (!hasMoreData && jobs.length > 0) {
                    return (
                      <View style={styles.endOfListContainer}>
                        <Text style={styles.endOfListText}>No more jobs to load</Text>
                      </View>
                    );
                  }
                  return null;
                }}
              />
            )}
          </View>
        )}

        {!selectedProject && !loading && (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Select a project</Text>
            <Text style={styles.emptySubtext}>
              Choose a project above to view its jobs
            </Text>
          </View>
        )}
      </View>

      {/* Statistics Summary Card - Fixed at bottom */}
      {summary && jobs.length > 0 && summary.jobsWithRecordsCount > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Summary</Text>
            {summary.isOvertime && (
              <View style={styles.overtimeIndicator}>
                <Ionicons name="warning" size={16} color="#ff4d4f" />
                <Text style={styles.overtimeText}>OVERTIME</Text>
              </View>
            )}
          </View>
          
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Allowed Hours</Text>
                <Text style={styles.summaryValue}>{summary.totalAllowedHours.toFixed(1)}h</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Actual Hours</Text>
                <Text style={[
                  styles.summaryValue,
                  summary.isOvertime && styles.summaryValueOvertime
                ]}>
                  {summary.totalActualHours.toFixed(1)}h
                </Text>
              </View>
            </View>
            
            {summary.isOvertime && (
              <View style={styles.overtimeRow}>
                <Text style={styles.overtimeLabel}>Overtime:</Text>
                <Text style={styles.overtimeValue}>+{summary.overtimeHours.toFixed(1)}h</Text>
              </View>
            )}
            
            <View style={styles.jobCountRow}>
              <Text style={styles.jobCountText}>
                {summary.jobsWithRecordsCount} of {summary.totalJobsCount} jobs have records
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Project Selection Modal - Bottom Sheet */}
      <Modal 
        visible={showProjectModal} 
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent={true}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProjectModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Project</Text>
              <TouchableOpacity onPress={() => setShowProjectModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={projects}
              renderItem={renderProjectItem}
              keyExtractor={(item) => item.id?.toString() || ''}
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Progress Update Modal */}
      <Modal 
        visible={showProgressModal} 
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent={true}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProgressModal(false)}
        >
          <TouchableOpacity 
            style={styles.progressModalContent}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Progress</Text>
              <TouchableOpacity onPress={() => setShowProgressModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.progressModalBody}>
              <Text style={styles.jobNameText}>{selectedJob?.jobDescription}</Text>
              
              <View style={styles.progressSection}>
                <Text style={styles.progressLabel}>Progress: {tempProgress.toFixed(0)}%</Text>
                
                {/* Custom Progress Slider */}
                <View style={styles.sliderContainer}>
                  <View style={styles.sliderTrack}>
                    <View 
                      style={[
                        styles.sliderFill, 
                        { width: `${tempProgress}%` }
                      ]} 
                    />
                    <TouchableOpacity
                      style={[
                        styles.sliderThumb,
                        { left: `${tempProgress}%` }
                      ]}
                      onPressIn={() => {}}
                    />
                  </View>
                </View>
                
                {/* Progress Buttons */}
                <View style={styles.progressButtons}>
                  {[0, 25, 50, 75, 100].map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.progressButton,
                        tempProgress === value && styles.progressButtonActive
                      ]}
                      onPress={() => setTempProgress(value)}
                    >
                      <Text style={[
                        styles.progressButtonText,
                        tempProgress === value && styles.progressButtonTextActive
                      ]}>
                        {value}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Fine adjustment buttons */}
                <View style={styles.adjustmentButtons}>
                  <TouchableOpacity
                    style={styles.adjustButton}
                    onPress={() => setTempProgress(Math.max(0, tempProgress - 5))}
                  >
                    <Ionicons name="remove" size={20} color="#666" />
                    <Text style={styles.adjustButtonText}>-5%</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.adjustButton}
                    onPress={() => setTempProgress(Math.min(100, tempProgress + 5))}
                  >
                    <Ionicons name="add" size={20} color="#666" />
                    <Text style={styles.adjustButtonText}>+5%</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.progressModalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowProgressModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.saveButton, updatingProgress && styles.saveButtonDisabled]}
                  onPress={handleProgressUpdate}
                  disabled={updatingProgress}
                >
                  {updatingProgress ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Progress</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  selectedText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  jobsSection: {
    flex: 1,
  },
  jobsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  jobsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  jobsCount: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  jobsList: {
    paddingBottom: 20,
  },
  jobCard: {
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
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  progressContainer: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1976d2',
    marginRight: 4,
  },
  editIcon: {
    marginLeft: 2,
  },
  jobDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  createDate: {
    fontSize: 12,
    color: '#999',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
  },
  viewButtonText: {
    fontSize: 12,
    color: '#2196F3',
    marginLeft: 4,
    fontWeight: '500',
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
  // Bottom Sheet Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    minHeight: '30%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalList: {
    flex: 1,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modalItemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  // Progress Modal Styles
  progressModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: '50%',
  },
  progressModalBody: {
    padding: 20,
  },
  jobNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressSection: {
    marginBottom: 30,
  },
  progressLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -8,
    width: 22,
    height: 22,
    backgroundColor: '#2196F3',
    borderRadius: 11,
    marginLeft: -11,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  progressButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  progressButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  progressButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  progressButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  progressButtonTextActive: {
    color: '#fff',
  },
  adjustmentButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  adjustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  adjustButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  progressModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2196F3',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
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
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  overtimeIndicator: {
    backgroundColor: '#ff4d4f',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  overtimeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 4,
  },
  summaryContent: {
    // marginBottom: 16, // Remove this to fix spacing
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryValueOvertime: {
    color: '#ff4d4f',
  },
  overtimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  overtimeLabel: {
    fontSize: 14,
    color: '#666',
  },
  overtimeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  jobCountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  jobCountText: {
    fontSize: 14,
    color: '#666',
  },
});

export default JobRecordsScreen; 