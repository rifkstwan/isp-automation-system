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
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';

export default function ScheduleScreen() {
  const navigation = useNavigation<any>();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSchedules = async () => {
    try {
      const res = await apiClient.get('/schedules/my');
      setSchedules(res.data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSchedules();
  }, []);

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'dijadwalkan': return { bg: '#dbeafe', text: '#2563eb' };
      case 'menuju lokasi': return { bg: '#fef3c7', text: '#d97706' };
      case 'sedang dikerjakan': return { bg: '#e0e7ff', text: '#4f46e5' };
      case 'selesai': return { bg: '#d1fae5', text: '#059669' };
      case 'batal': return { bg: '#fee2e2', text: '#ef4444' };
      default: return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  const getJobIcon = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'instalasi baru': return 'tools';
      case 'perbaikan gangguan': return 'wrench';
      case 'maintenance': return 'cogs';
      default: return 'calendar-check';
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusStyle = getStatusColor(item.status);
    const scheduleId = `#JDW-${item.id.toString().padStart(4, '0')}`;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.jobTypeContainer}>
            <View style={styles.iconCircle}>
              <FontAwesome5 name={getJobIcon(item.jenis_pekerjaan)} size={16} color="#2563eb" />
            </View>
            <View>
              <Text style={styles.jobTypeText}>{item.jenis_pekerjaan}</Text>
              <Text style={styles.scheduleId}>{scheduleId}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.dashedLineContainer}>
          {Array.from({ length: 25 }).map((_, i) => (
            <View key={i} style={styles.dashItem} />
          ))}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#64748b" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              {new Date(item.tanggal_kunjungan).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#64748b" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              {new Date(item.tanggal_kunjungan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color="#64748b" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Teknisi: {item.teknisi?.name || 'Menunggu Penugasan'}
            </Text>
          </View>
          {item.catatan_pelanggan && (
            <View style={styles.noteContainer}>
              <Text style={styles.noteLabel}>Catatan:</Text>
              <Text style={styles.noteText}>{item.catatan_pelanggan}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Jadwal Teknisi</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : schedules.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="calendar-clear-outline" size={48} color="#94a3b8" />
          </View>
          <Text style={styles.emptyTitle}>Belum Ada Jadwal</Text>
          <Text style={styles.emptyText}>Tidak ada jadwal kunjungan teknisi ke lokasi Anda saat ini.</Text>
        </View>
      ) : (
        <FlatList
          data={schedules}
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
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginTop: 16 },
  emptyText: { color: '#64748b', marginTop: 8, fontSize: 13, textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
  emptyIconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16, paddingBottom: 40 },
  
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jobTypeText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  scheduleId: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  dashedLineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  dashItem: {
    width: 6,
    height: 1,
    backgroundColor: '#cbd5e1',
    borderRadius: 1,
  },
  cardBody: {},
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    marginRight: 12,
    width: 20,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#334155',
  },
  noteContainer: {
    marginTop: 8,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#cbd5e1',
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  }
});
