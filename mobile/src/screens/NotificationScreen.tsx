import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';

export default function NotificationScreen() {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications');
      // Backend returns either direct array or data object
      setNotifications(res.data.data || res.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      // Update local state
      setNotifications(prev => 
        prev.map(notif => notif.id === id ? { ...notif, is_read: true } : notif)
      );
    } catch (error) {
      console.error('Gagal membaca notifikasi:', error);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.notifCard, !item.is_read && styles.notifUnread]} 
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={item.type === 'billing' ? 'receipt' : item.type === 'ticket_update' ? 'headset' : 'notifications'} 
          size={24} 
          color="#2563eb" 
        />
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, !item.is_read && styles.textBold]}>{item.title}</Text>
        <Text style={styles.notifMessage}>{item.message}</Text>
        <Text style={styles.notifDate}>
          {new Date(item.created_at).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifikasi</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyText}>Belum ada notifikasi baru</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: '#ffffff',
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9' 
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
  listContainer: { padding: 16 },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  notifUnread: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 4,
  },
  textBold: {
    fontWeight: 'bold',
  },
  notifMessage: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 8,
  },
  notifDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
    marginTop: 6,
  }
});
