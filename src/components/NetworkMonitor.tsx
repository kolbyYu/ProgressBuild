import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';

interface NetworkLog {
  id: string;
  timestamp: Date;
  url: string;
  method: string;
  requestBody?: any;
  responseStatus?: number;
  responseData?: any;
  duration?: number;
  error?: string;
}

interface NetworkMonitorProps {
  visible: boolean;
  onClose: () => void;
}

const NetworkMonitor: React.FC<NetworkMonitorProps> = ({ visible, onClose }) => {
  const [logs, setLogs] = useState<NetworkLog[]>([]);

  useEffect(() => {
    // 监听控制台日志
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      originalLog(...args);
      
      // 解析API请求日志
      if (args[0] === '🌐 API Request:') {
        const requestData = args[1];
        const log: NetworkLog = {
          id: Date.now().toString(),
          timestamp: new Date(),
          url: requestData.url,
          method: requestData.method,
          requestBody: requestData.body,
        };
        setLogs(prev => [log, ...prev.slice(0, 49)]); // 保留最近50条
      }
      
      // 解析API响应日志
      if (args[0] === '📡 API Response:') {
        const responseData = args[1];
        setLogs(prev => prev.map(log => 
          log.url === responseData.url 
            ? { ...log, responseStatus: responseData.status, duration: responseData.duration }
            : log
        ));
      }
      
      // 解析响应数据日志
      if (args[0] === '📦 Response Data:') {
        const data = args[1];
        setLogs(prev => prev.map(log => 
          log.url === data.url 
            ? { ...log, responseData: data }
            : log
        ));
      }
    };

    console.error = (...args) => {
      originalError(...args);
      
      // 解析错误日志
      if (args[0] === '❌ API Error:') {
        const errorData = args[1];
        setLogs(prev => prev.map(log => 
          log.url === errorData.url 
            ? { ...log, error: errorData.error }
            : log
        ));
      }
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    return `${duration}ms`;
  };

  const getStatusColor = (status?: number) => {
    if (!status) return '#666';
    if (status >= 200 && status < 300) return '#4CAF50';
    if (status >= 400 && status < 500) return '#FF9800';
    return '#F44336';
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Network Monitor</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={clearLogs} style={styles.button}>
              <Text style={styles.buttonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.button}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView style={styles.logsContainer}>
          {logs.length === 0 ? (
            <Text style={styles.emptyText}>No network requests yet</Text>
          ) : (
            logs.map(log => (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logHeader}>
                  <Text style={styles.method}>{log.method}</Text>
                  <Text style={styles.url} numberOfLines={1}>{log.url}</Text>
                  <Text style={[styles.status, { color: getStatusColor(log.responseStatus) }]}>
                    {log.responseStatus || 'Pending'}
                  </Text>
                </View>
                
                <Text style={styles.timestamp}>
                  {log.timestamp.toLocaleTimeString()}
                  {log.duration && ` • ${formatDuration(log.duration)}`}
                </Text>
                
                {log.requestBody && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Request Body:</Text>
                    <Text style={styles.jsonText}>
                      {JSON.stringify(log.requestBody, null, 2)}
                    </Text>
                  </View>
                )}
                
                {log.responseData && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Response:</Text>
                    <Text style={styles.jsonText}>
                      {JSON.stringify(log.responseData, null, 2)}
                    </Text>
                  </View>
                )}
                
                {log.error && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Error:</Text>
                    <Text style={styles.errorText}>{log.error}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2196F3',
    paddingTop: 50,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  button: {
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
  logsContainer: {
    flex: 1,
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
  },
  logItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  method: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  url: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  jsonText: {
    fontSize: 11,
    color: '#333',
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  errorText: {
    fontSize: 11,
    color: '#F44336',
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 4,
  },
});

export default NetworkMonitor; 