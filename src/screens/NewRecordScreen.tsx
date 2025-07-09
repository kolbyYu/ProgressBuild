import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { apiService } from '../services/api';
import { Estimate, JobCategoryResponse, JobItemResponse } from '../types';

const NewRecordScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const isForeman = user?.roleName === 'Foreman';
  const isWorker = user?.roleName === 'Worker';

  // Form state
  const [selectedProject, setSelectedProject] = useState<Estimate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<JobCategoryResponse | null>(null);
  const [selectedTask, setSelectedTask] = useState<JobItemResponse | null>(null);
  const [beginTime, setStartTime] = useState(() => {
    const now = new Date();
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now;
  });
  const [endTime, setEndTime] = useState(() => {
    const now = new Date();
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now;
  });
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  // Data state
  const [projects, setProjects] = useState<Estimate[]>([]);
  const [categories, setCategories] = useState<JobCategoryResponse[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Custom time picker state
  const [tempStartHour, setTempStartHour] = useState(beginTime.getHours());
  const [tempStartMinute, setTempStartMinute] = useState(0);
  const [tempEndHour, setTempEndHour] = useState(endTime.getHours());
  const [tempEndMinute, setTempEndMinute] = useState(0);

  // Generate hours array (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 30];

  useEffect(() => {
    if (isForeman) {
      fetchForemanProjects();
    }
    // Worker角色不再初始加载所有estimates
  }, [isForeman, isWorker]);

  // Debounced search effect for Worker role
  useEffect(() => {
    if (isWorker && searchKeyword.trim()) {
      const timeoutId = setTimeout(() => {
        searchEstimates(searchKeyword);
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    } else if (isWorker && !searchKeyword.trim()) {
      // 清空搜索结果当搜索框为空时
      setProjects([]);
      setSelectedProject(null);
      setSelectedCategory(null);
      setSelectedTask(null);
      setCategories([]);
    }
  }, [searchKeyword, isWorker]);

  const fetchForemanProjects = async () => {
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
            fetchCategories(firstProject.id);
          }
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const searchEstimates = async (keyword: string) => {
    setSearchLoading(true);
    try {
      const response = await apiService.searchEstimates(keyword.trim() || undefined);
      if (response.success && response.data) {
        setProjects(response.data);
        
        // Reset selections when search results change
        if (selectedProject) {
          const stillExists = response.data.find(p => p.id === selectedProject.id);
          if (!stillExists) {
            setSelectedProject(null);
            setSelectedCategory(null);
            setSelectedTask(null);
            setCategories([]);
          }
        }
        
        // Auto-select the first project if available and no project is currently selected
        if (!selectedProject && response.data.length > 0) {
          const firstProject = response.data[0];
          setSelectedProject(firstProject);
          if (firstProject.id) {
            fetchCategories(firstProject.id);
          }
        }
      } else {
        setProjects([]);
        setSelectedProject(null);
        setSelectedCategory(null);
        setSelectedTask(null);
        setCategories([]);
      }
    } catch (error) {
      console.error('Search estimates error:', error);
      Alert.alert('Error', 'Failed to search projects');
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchCategories = async (projectId: number) => {
    setLoading(true);
    try {
      const response = await apiService.getJobsByEstimate(projectId);
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (project: Estimate) => {
    setSelectedProject(project);
    setSelectedCategory(null);
    setSelectedTask(null);
    setShowProjectModal(false);
    if (project.id) {
      fetchCategories(project.id);
    }
  };

  const handleCategorySelect = (category: JobCategoryResponse) => {
    setSelectedCategory(category);
    setSelectedTask(null);
    setShowCategoryModal(false);
  };

  const handleTaskSelect = (task: JobItemResponse) => {
    setSelectedTask(task);
    setShowTaskModal(false);
  };

  const handleAddPhoto = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      },
      (response) => {
        if (response.assets && response.assets[0]) {
          const uri = response.assets[0].uri;
          if (uri) {
            setPhotos([...photos, uri]);
          }
        }
      }
    );
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  const handleStartTimeConfirm = () => {
    const newTime = new Date(beginTime);
    newTime.setHours(tempStartHour);
    newTime.setMinutes(tempStartMinute);
    newTime.setSeconds(0);
    newTime.setMilliseconds(0);
    
    // Debug log to verify 24-hour format
    console.log('⏰ Start Time Confirmed:', {
      selectedHour: tempStartHour,
      selectedMinute: tempStartMinute,
      dateObject: newTime,
      isoString: newTime.toISOString(),
      localString24h: newTime.toLocaleString('en-US', { hour12: false }),
    });
    
    setStartTime(newTime);
    setShowStartTimePicker(false);
  };

  const handleEndTimeConfirm = () => {
    const newTime = new Date(endTime);
    newTime.setHours(tempEndHour);
    newTime.setMinutes(tempEndMinute);
    newTime.setSeconds(0);
    newTime.setMilliseconds(0);
    
    // Debug log to verify 24-hour format
    console.log('⏰ End Time Confirmed:', {
      selectedHour: tempEndHour,
      selectedMinute: tempEndMinute,
      dateObject: newTime,
      isoString: newTime.toISOString(),
      localString24h: newTime.toLocaleString('en-US', { hour12: false }),
    });
    
    setEndTime(newTime);
    setShowEndTimePicker(false);
  };

  const handleStartTimeCancel = () => {
    setTempStartHour(beginTime.getHours());
    setTempStartMinute(0);
    setShowStartTimePicker(false);
  };

  const handleEndTimeCancel = () => {
    setTempEndHour(endTime.getHours());
    setTempEndMinute(0);
    setShowEndTimePicker(false);
  };

  const handleSubmit = async () => {
    if (!selectedProject || !selectedCategory || !selectedTask) {
      Alert.alert('Error', 'Please select project, category, and task');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (beginTime >= endTime) {
      Alert.alert('Error', 'Begin time must be earlier than end time');
      return;
    }

    setLoading(true);
    try {
      // Upload photos first if any
      const photoUrls: string[] = [];
      for (const photo of photos) {
        console.log('📸 Uploading photo:', photo);
        const uploadResponse = await apiService.uploadImage(photo);
        console.log('📸 Upload response:', uploadResponse);
        
        if (uploadResponse.success && uploadResponse.data) {
          photoUrls.push(uploadResponse.data.url);
        } else {
          console.error('❌ Photo upload failed:', uploadResponse.error);
          Alert.alert('Error', `Failed to upload photo: ${uploadResponse.error || 'Unknown error'}`);
          return;
        }
      }

      // Save job record - pass Date objects, let API service handle formatting
      const recordData = {
        jobId: selectedTask.itemId || 0,
        recordDescription: description,
        photos: photoUrls,
        beginTime: beginTime,
        endTime: endTime,
      };

      // Debug log to verify time format
      console.log('📅 Submitting work record with times:', {
        beginTime: beginTime.toISOString(),
        endTime: endTime.toISOString(),
        beginTimeLocal: beginTime.toLocaleString('en-US', { hour12: false }),
        endTimeLocal: endTime.toLocaleString('en-US', { hour12: false }),
      });

      const response = await apiService.saveJobRecord(recordData);
      if (response.success) {
        Alert.alert('Success', 'Work record saved successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to save record');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save record');
    } finally {
      setLoading(false);
    }
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

  const renderCategoryItem = ({ item }: { item: JobCategoryResponse }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => handleCategorySelect(item)}
    >
      <Text style={styles.modalItemTitle}>{item.categoryName}</Text>
      <Text style={styles.modalItemSubtitle}>{item.categoryDescription}</Text>
    </TouchableOpacity>
  );

  const renderTaskItem = ({ item }: { item: JobItemResponse }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => handleTaskSelect(item)}
    >
      <Text style={styles.modalItemTitle}>{item.itemDescription}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>New Work Record</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Project Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project</Text>
          {isWorker && (
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search projects by description..."
                  value={searchKeyword}
                  onChangeText={setSearchKeyword}
                />
                {searchLoading && (
                  <ActivityIndicator 
                    size="small" 
                    color="#2196F3" 
                    style={styles.searchLoadingIndicator}
                  />
                )}
              </View>
            </View>
          )}
          {(isForeman || (isWorker && projects.length > 0)) && (
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowProjectModal(true)}
            >
              <Text style={selectedProject ? styles.selectedText : styles.placeholderText}>
                {selectedProject ? (selectedProject.description || selectedProject.refNO || 'Untitled Project') : 'Select Project'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          )}
          {isWorker && !searchKeyword.trim() && (
            <Text style={styles.searchHintText}>Please enter keywords to search for projects</Text>
          )}
          {isWorker && projects.length === 0 && searchKeyword.trim() && !searchLoading && (
            <Text style={styles.noResultsText}>No projects found matching "{searchKeyword}"</Text>
          )}
        </View>

        {/* Category Selection */}
        {selectedProject && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Stage</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={selectedCategory ? styles.selectedText : styles.placeholderText}>
                {selectedCategory ? selectedCategory.categoryName : 'Select Category'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {/* Task Selection */}
        {selectedCategory && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Task</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowTaskModal(true)}
            >
              <Text style={selectedTask ? styles.selectedText : styles.placeholderText}>
                {selectedTask ? selectedTask.itemDescription : 'Select Task'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Time</Text>
          <View style={styles.timeContainer}>
            <TouchableOpacity
              style={styles.timeSelector}
              onPress={() => {
                setTempStartHour(beginTime.getHours());
                setTempStartMinute(0);
                setShowStartTimePicker(true);
              }}
            >
              <Text style={styles.timeLabel}>Begin Time</Text>
              <Text style={styles.timeText}>
                {beginTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.timeSelector}
              onPress={() => {
                setTempEndHour(endTime.getHours());
                setTempEndMinute(0);
                setShowEndTimePicker(true);
              }}
            >
              <Text style={styles.timeLabel}>End Time</Text>
              <Text style={styles.timeText}>
                {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Enter work description..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
            <Ionicons name="camera" size={24} color="#2196F3" />
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
          {photos.length > 0 && (
            <View style={styles.photoGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => handleRemovePhoto(index)}
                  >
                    <Ionicons name="close-circle" size={20} color="#f44336" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      {/* Fixed Submit Button */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Save Record</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Project Modal - Bottom Sheet */}
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

      {/* Category Modal - Bottom Sheet */}
      <Modal 
        visible={showCategoryModal} 
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent={true}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.categoryId?.toString() || ''}
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Task Modal - Bottom Sheet */}
      <Modal 
        visible={showTaskModal} 
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent={true}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTaskModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Task</Text>
              <TouchableOpacity onPress={() => setShowTaskModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={selectedCategory?.items || []}
              renderItem={renderTaskItem}
              keyExtractor={(item) => item.itemId?.toString() || ''}
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Custom Begin Time Picker Modal */}
      <Modal 
        visible={showStartTimePicker} 
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent={true}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleStartTimeCancel}
        >
          <TouchableOpacity 
            style={styles.timePickerModal}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.timePickerHeader}>
              <TouchableOpacity onPress={handleStartTimeCancel}>
                <Text style={styles.timePickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.timePickerTitle}>Select Begin Time</Text>
              <TouchableOpacity onPress={handleStartTimeConfirm}>
                <Text style={styles.timePickerConfirm}>Confirm</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.timePickerContent}>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Hour</Text>
                <Picker
                  selectedValue={tempStartHour}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  onValueChange={(itemValue) => setTempStartHour(itemValue)}
                >
                  {hours.map((hour) => (
                    <Picker.Item 
                      key={hour} 
                      label={hour.toString().padStart(2, '0')} 
                      value={hour} 
                      color="#333"
                    />
                  ))}
                </Picker>
              </View>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Minute</Text>
                <Picker
                  selectedValue={tempStartMinute}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  onValueChange={(itemValue) => setTempStartMinute(itemValue)}
                >
                  {minutes.map((minute) => (
                    <Picker.Item 
                      key={minute} 
                      label={minute.toString().padStart(2, '0')} 
                      value={minute} 
                      color="#333"
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Custom End Time Picker Modal */}
      <Modal 
        visible={showEndTimePicker} 
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent={true}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleEndTimeCancel}
        >
          <TouchableOpacity 
            style={styles.timePickerModal}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.timePickerHeader}>
              <TouchableOpacity onPress={handleEndTimeCancel}>
                <Text style={styles.timePickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.timePickerTitle}>Select End Time</Text>
              <TouchableOpacity onPress={handleEndTimeConfirm}>
                <Text style={styles.timePickerConfirm}>Confirm</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.timePickerContent}>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Hour</Text>
                <Picker
                  selectedValue={tempEndHour}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  onValueChange={(itemValue) => setTempEndHour(itemValue)}
                >
                  {hours.map((hour) => (
                    <Picker.Item 
                      key={hour} 
                      label={hour.toString().padStart(2, '0')} 
                      value={hour} 
                      color="#333"
                    />
                  ))}
                </Picker>
              </View>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Minute</Text>
                <Picker
                  selectedValue={tempEndMinute}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  onValueChange={(itemValue) => setTempEndMinute(itemValue)}
                >
                  {minutes.map((minute) => (
                    <Picker.Item 
                      key={minute} 
                      label={minute.toString().padStart(2, '0')} 
                      value={minute} 
                      color="#333"
                    />
                  ))}
                </Picker>
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
  scrollContent: {
    paddingBottom: 20,
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
  searchContainer: {
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchLoadingIndicator: {
    marginLeft: 8,
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
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeSelector: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    fontSize: 16,
    minHeight: 100,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
  },
  addPhotoText: {
    fontSize: 16,
    color: '#2196F3',
    marginLeft: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  fixedButtonContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
  },
  // Custom Time Picker Styles
  timePickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    minHeight: '40%',
  },
  timePickerHeader: {
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
  timePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  timePickerCancel: {
    fontSize: 16,
    color: '#666',
  },
  timePickerConfirm: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  timePickerContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  pickerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  picker: {
    width: '100%',
    height: 150,
  },
  pickerItem: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  searchHintText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default NewRecordScreen; 