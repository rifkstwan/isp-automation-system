import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';

export default function TicketScreen({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const navigation = useNavigation<any>();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const API_URL = 'http://192.168.100.91:8000'; // Sesuaikan IP backend

  const fetchTickets = async () => {
    try {
      const res = await apiClient.get('/tickets');
      setTickets(res.data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTickets();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmitTicket = async () => {
    if (!judul || !deskripsi) {
      Alert.alert('Error', 'Judul dan Deskripsi masalah harus diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('judul', judul);
      formData.append('deskripsi', deskripsi);
      formData.append('prioritas', 'sedang');
      
      if (imageUri) {
        const localUri = imageUri;
        const filename = localUri.split('/').pop() || 'ticket.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('foto', {
          uri: localUri,
          name: filename,
          type
        } as any);
      }

      await apiClient.post('/tickets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      Alert.alert('Sukses', 'Laporan gangguan berhasil dikirim.');
      setModalVisible(false);
      setJudul('');
      setDeskripsi('');
      setImageUri(null);
      fetchTickets();
    } catch (error: any) {
      Alert.alert('Gagal', error.response?.data?.message || 'Terjadi kesalahan saat mengirim laporan.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'menunggu': return { bg: '#fef3c7', text: '#d97706' };
      case 'diproses': return { bg: '#dbeafe', text: '#2563eb' };
      case 'selesai': return { bg: '#d1fae5', text: '#059669' };
      default: return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusStyle = getStatusColor(item.status);
    const ticketId = `#TKT-${item.id.toString().padStart(4, '0')}`;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <View style={styles.iconBox}>
              <Ionicons name="document-text" size={16} color="#2563eb" />
            </View>
            <View style={styles.titleTextContainer}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.judul}</Text>
              <Text style={styles.ticketId}>{ticketId}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
        
        {item.foto && (
          <Image 
            source={{ uri: `${API_URL}/storage/${item.foto}` }} 
            style={styles.cardImage} 
            resizeMode="cover"
          />
        )}

        <View style={styles.dashedLineContainer}>
          {Array.from({ length: 25 }).map((_, i) => (
            <View key={i} style={styles.dashItem} />
          ))}
        </View>

        <Text style={styles.cardDesc}>{item.deskripsi}</Text>
        <View style={styles.cardFooter}>
          <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isEmbedded && { paddingTop: 0, backgroundColor: 'transparent' }]}>
      {!isEmbedded && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lapor Gangguan</Text>
          <View style={{ width: 24 }} />
        </View>
      )}
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : tickets.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="headset-outline" size={48} color="#94a3b8" />
          </View>
          <Text style={styles.emptyTitle}>Layanan Terpantau Aman</Text>
          <Text style={styles.emptyText}>Anda belum pernah membuat laporan gangguan. Klik tombol + di bawah jika ada kendala.</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContainer, isEmbedded && { paddingBottom: 120 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, isEmbedded && { bottom: 110 }]} 
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal Buat Tiket */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buat Laporan Baru</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Judul Masalah</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: Internet Mati Total"
                  value={judul}
                  onChangeText={setJudul}
                  maxLength={100}
                />
              </View>

              <Text style={styles.label}>Deskripsi Detail</Text>
              <View style={[styles.inputContainer, { height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
                <TextInput
                  style={[styles.input, { height: '100%', textAlignVertical: 'top' }]}
                  placeholder="Jelaskan detail kendala yang Anda alami..."
                  value={deskripsi}
                  onChangeText={setDeskripsi}
                  multiline
                />
              </View>

              <Text style={styles.label}>Lampirkan Foto (Opsional)</Text>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <Ionicons name="camera-outline" size={24} color="#94a3b8" />
                    <Text style={styles.imagePickerText}>Ambil dari Galeri</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
                onPress={handleSubmitTicket}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Kirim Laporan</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  listContainer: { padding: 16, paddingBottom: 100 },
  
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  ticketId: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  cardImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
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
    marginBottom: 12,
    overflow: 'hidden',
  },
  dashItem: {
    width: 6,
    height: 1,
    backgroundColor: '#cbd5e1',
    borderRadius: 1,
  },
  cardDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 6,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
  },
  imagePickerBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    height: 100,
    marginBottom: 20,
    overflow: 'hidden',
  },
  imagePickerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  imagePickerText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  submitBtn: {
    backgroundColor: '#0f172a',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
