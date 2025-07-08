import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { apiService } from '../services/api';
import { NotificationMessage, NotificationResponse } from '../types';

// 模拟数据 - 用于开发测试
const mockNotifications: NotificationMessage[] = [
  {
    id: 1,
    userId: 1,
    title: 'New Job Assignment',
    content: 'You have been assigned to a new construction project at Downtown Plaza. Please review the project details and prepare accordingly.',
    type: 'job_assignment',
    isRead: false,
    priority: 'high',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: 2,
    userId: 1,
    title: 'Job Progress Update',
    content: 'The electrical work at Site A has been completed. Please update your progress and move to the next phase.',
    type: 'job_update',
    isRead: false,
    priority: 'medium',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  },
  {
    id: 3,
    userId: 1,
    title: 'System Maintenance',
    content: 'The system will undergo maintenance tonight from 10 PM to 2 AM. Please save your work before the maintenance window.',
    type: 'system',
    isRead: true,
    priority: 'medium',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    readAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: 4,
    userId: 1,
    title: 'Clock-in Reminder',
    content: 'Don\'t forget to clock in when you arrive at the job site. Your scheduled start time is 8:00 AM.',
    type: 'reminder',
    isRead: true,
    priority: 'low',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    readAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
  },
  {
    id: 5,
    userId: 1,
    title: 'Important Announcement',
    content: 'New safety protocols are now in effect. Please attend the mandatory safety briefing tomorrow at 9 AM.',
    type: 'announcement',
    isRead: false,
    priority: 'high',
    createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 1 day ago
  },
];

const NotificationsScreen = () => {
  const navigation = useNavigation();
  
  // 状态管理
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [useMockData, setUseMockData] = useState(false);

  // 获取通知列表
  const fetchNotifications = async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let response;
      let success = false;

      // 尝试从API获取数据
      try {
        response = await apiService.getNotifications(pageNum, 20);
        success = response.success;
      } catch (apiError) {
        console.log('API not available, using mock data:', apiError);
        setUseMockData(true);
        success = false;
      }

      if (success && response?.data) {
        const newNotifications = response.data.notifications;
        
        if (isRefresh || pageNum === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
        }
        
        setUnreadCount(response.data.unreadCount);
        setHasMore(newNotifications.length === 20);
        setPage(pageNum);
      } else {
        // 使用模拟数据
        if (pageNum === 1) {
          setNotifications(mockNotifications);
          setUnreadCount(mockNotifications.filter(n => !n.isRead).length);
          setHasMore(false);
        }
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // 出错时使用模拟数据
      if (pageNum === 1) {
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.isRead).length);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // 刷新通知列表
  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications(1, true);
  };

  // 加载更多通知
  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !useMockData) {
      fetchNotifications(page + 1);
    }
  };

  // 标记通知为已读
  const markAsRead = async (notificationId: number) => {
    try {
      if (useMockData) {
        // 模拟数据模式
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true, readAt: new Date() }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return;
      }

      const response = await apiService.markNotificationAsRead(notificationId);
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true, readAt: new Date() }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // 即使API失败，也在本地更新状态
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // 标记所有通知为已读
  const markAllAsRead = async () => {
    try {
      if (useMockData) {
        // 模拟数据模式
        setNotifications(prev => 
          prev.map(notification => ({ 
            ...notification, 
            isRead: true, 
            readAt: new Date() 
          }))
        );
        setUnreadCount(0);
        return;
      }

      const response = await apiService.markAllNotificationsAsRead();
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => ({ 
            ...notification, 
            isRead: true, 
            readAt: new Date() 
          }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // 即使API失败，也在本地更新状态
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          isRead: true, 
          readAt: new Date() 
        }))
      );
      setUnreadCount(0);
    }
  };

  // 删除通知
  const deleteNotification = async (notificationId: number) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (useMockData) {
                // 模拟数据模式
                const deletedNotification = notifications.find(n => n.id === notificationId);
                setNotifications(prev => 
                  prev.filter(notification => notification.id !== notificationId)
                );
                
                if (deletedNotification && !deletedNotification.isRead) {
                  setUnreadCount(prev => Math.max(0, prev - 1));
                }
                return;
              }

              const response = await apiService.deleteNotification(notificationId);
              
              if (response.success) {
                setNotifications(prev => 
                  prev.filter(notification => notification.id !== notificationId)
                );
                
                // 如果删除的是未读通知，减少未读数量
                const deletedNotification = notifications.find(n => n.id === notificationId);
                if (deletedNotification && !deletedNotification.isRead) {
                  setUnreadCount(prev => Math.max(0, prev - 1));
                }
              }
            } catch (error) {
              console.error('Error deleting notification:', error);
              // 即使API失败，也在本地删除
              const deletedNotification = notifications.find(n => n.id === notificationId);
              setNotifications(prev => 
                prev.filter(notification => notification.id !== notificationId)
              );
              
              if (deletedNotification && !deletedNotification.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
              }
            }
          }
        }
      ]
    );
  };

  // 获取通知图标
  const getNotificationIcon = (type: NotificationMessage['type']) => {
    switch (type) {
      case 'job_assignment':
        return 'briefcase';
      case 'job_update':
        return 'refresh';
      case 'system':
        return 'settings';
      case 'reminder':
        return 'alarm';
      case 'announcement':
        return 'megaphone';
      default:
        return 'notifications';
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: NotificationMessage['priority']) => {
    switch (priority) {
      case 'high':
        return '#FF5722';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return '#2196F3';
    }
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // 渲染通知项
  const renderNotificationItem = ({ item }: { item: NotificationMessage }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification
      ]}
      onPress={() => !item.isRead && markAsRead(item.id)}
      onLongPress={() => deleteNotification(item.id)}
    >
      <View style={styles.notificationHeader}>
        <View style={[styles.iconContainer, { backgroundColor: getPriorityColor(item.priority) + '15' }]}>
          <Ionicons 
            name={getNotificationIcon(item.type)} 
            size={20} 
            color={getPriorityColor(item.priority)} 
          />
        </View>
        <View style={styles.notificationContent}>
          <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.time}>
            {formatTime(new Date(item.createdAt))}
          </Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
      <Text style={styles.content} numberOfLines={2}>
        {item.content}
      </Text>
    </TouchableOpacity>
  );

  // 渲染加载更多指示器
  const renderLoadMoreIndicator = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color="#2196F3" />
        <Text style={styles.loadMoreText}>Loading more...</Text>
      </View>
    );
  };

  // 渲染空状态
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptySubtitle}>
        You'll receive notifications about job updates, assignments, and important announcements here.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
          {useMockData && (
            <View style={styles.mockBadgeContainer}>
              <Text style={styles.mockBadgeText}>DEV</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllReadText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {useMockData && (
        <View style={styles.mockDataBanner}>
          <Ionicons name="warning" size={16} color="#FF9800" />
          <Text style={styles.mockDataText}>
            Using demo data - API not available
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2196F3']}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderLoadMoreIndicator}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  badgeContainer: {
    backgroundColor: '#FF5722',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllReadText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  mockBadgeContainer: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 16,
    alignItems: 'center',
  },
  mockBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mockDataBanner: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mockDataText: {
    fontSize: 12,
    color: '#E65100',
    marginLeft: 8,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  notificationItem: {
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
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  time: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
  },
  content: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
});

export default NotificationsScreen; 