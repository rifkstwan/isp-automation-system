import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';

export default function OrderScreen() {
  const navigation = useNavigation<any>();
  const [pakets, setPakets] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPaket, setSelectedPaket] = useState<any>(null);
  const [alamat, setAlamat] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch pakets
      const paketsRes = await apiClient.get('/pakets');
      setPakets(paketsRes.data || []);

      // Check active orders to determine if this is Upgrade or New Install
      const ordersRes = await apiClient.get('/orders/my');
      const pending = ordersRes.data?.filter((o: any) => o.status === 'pending') || [];
      const active = ordersRes.data?.find((o: any) => o.status === 'aktif' || o.status === 'pending' || o.status === 'dibayar');
      setActiveOrder(active);
    } catch (error) {
      console.error('Error fetching order data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const handleSelectPaket = (paket: any) => {
    if (activeOrder && activeOrder.paket_id === paket.id) {
      Alert.alert('Info', 'Anda sedang menggunakan paket ini.');
      return;
    }
    setSelectedPaket(paket);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!activeOrder && !alamat) {
      Alert.alert('Error', 'Alamat pemasangan wajib diisi untuk pelanggan baru.');
      return;
    }

    setSubmitting(true);
    try {
      if (activeOrder) {
        // Upgrade flow
        await apiClient.post(`/orders/${activeOrder.id}/upgrade`, {
          paket_id: selectedPaket.id
        });
        Alert.alert('Sukses', 'Permintaan upgrade paket berhasil dikirim. Layanan akan segera disesuaikan.');
      } else {
        // New Install flow
        await apiClient.post('/orders', {
          paket_id: selectedPaket.id,
          alamat_pemasangan: alamat
        });
        Alert.alert('Sukses', 'Pemesanan berhasil. Tim teknisi kami akan segera menjadwalkan pemasangan.');
      }
      setModalVisible(false);
      navigation.navigate('OrderHistory');
    } catch (error: any) {
      Alert.alert('Gagal', error.response?.data?.message || 'Terjadi kesalahan saat memproses pesanan.');
    } finally {
      setSubmitting(false);
    }
  };

  const backgroundImages = [
    // 1. Browsing Santai / Sosmed (Basic)
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=800&auto=format&fit=crop',
    // 2. WFH / Produktivitas (Standard)
    'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=800&auto=format&fit=crop',
    // 3. Gaming & Streaming (Premium)
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
    // 4. Bisnis / Kantor (Ultra)
    'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop',
    // 5. Cadangan
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800&auto=format&fit=crop'
  ];

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isCurrentPlan = activeOrder && activeOrder.paket_id === item.id;
    const bgImage = backgroundImages[index % backgroundImages.length];
    
    return (
      <ImageBackground 
        source={{ uri: bgImage }}
        style={[styles.card, isCurrentPlan && styles.cardCurrent]}
        imageStyle={{ borderRadius: 16 }}
      >
        <View style={styles.cardOverlay}>
          <View style={styles.cardHeader}>
            <Text style={styles.paketName}>{item.nama}</Text>
            {isCurrentPlan && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>PAKET SAAT INI</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.paketSpeed}>{item.kecepatan} Mbps</Text>
          <Text style={styles.paketDesc}>{item.deskripsi}</Text>
          
          <View style={styles.cardFooter}>
            <Text style={styles.paketPrice}>{formatRupiah(item.harga)}<Text style={styles.pricePeriod}>/bln</Text></Text>
            <TouchableOpacity 
              style={[styles.actionBtn, isCurrentPlan && styles.actionBtnDisabled]}
              disabled={isCurrentPlan}
              onPress={() => handleSelectPaket(item)}
            >
              <Text style={styles.actionBtnText}>{activeOrder ? 'Upgrade' : 'Pilih'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{activeOrder ? 'Upgrade Speed' : 'Pilih Layanan'}</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={pakets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Confirmation Modal */}
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
              <Text style={styles.modalTitle}>Konfirmasi Layanan</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Paket Pilihan:</Text>
                <Text style={styles.summaryValue}>{selectedPaket?.nama}</Text>
                <Text style={styles.summarySpeed}>{selectedPaket?.kecepatan} Mbps</Text>
                <View style={styles.divider} />
                <Text style={styles.summaryLabel}>Biaya Bulanan:</Text>
                <Text style={styles.summaryPrice}>{selectedPaket ? formatRupiah(selectedPaket.harga) : ''}</Text>
              </View>

              {!activeOrder && (
                <>
                  <Text style={styles.label}>Alamat Pemasangan</Text>
                  <View style={[styles.inputContainer, { height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
                    <TextInput
                      style={[styles.input, { height: '100%', textAlignVertical: 'top' }]}
                      placeholder="Masukkan alamat lengkap rumah Anda..."
                      value={alamat}
                      onChangeText={setAlamat}
                      multiline
                    />
                  </View>
                </>
              )}

              {activeOrder && (
                <View style={styles.upgradeInfoBox}>
                  <Ionicons name="information-circle-outline" size={20} color="#2563eb" />
                  <Text style={styles.upgradeInfoText}>
                    Anda akan melakukan upgrade dari layanan saat ini. Perubahan tagihan akan menyesuaikan pada siklus bulan berikutnya.
                  </Text>
                </View>
              )}

              <TouchableOpacity 
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>{activeOrder ? 'Konfirmasi Upgrade' : 'Pesan Sekarang'}</Text>
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
  listContainer: { padding: 16 },
  
  card: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardCurrent: {
    borderColor: '#60a5fa',
    borderWidth: 2,
  },
  cardOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paketName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  currentBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  paketSpeed: {
    fontSize: 28,
    fontWeight: '900',
    color: '#60a5fa',
    marginBottom: 8,
  },
  paketDesc: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 16,
  },
  paketPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  pricePeriod: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#94a3b8',
  },
  actionBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionBtnDisabled: {
    backgroundColor: 'rgba(148, 163, 184, 0.5)',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  summaryBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  summarySpeed: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#bfdbfe',
    marginVertical: 12,
  },
  summaryPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
  },
  upgradeInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  upgradeInfoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#1e293b',
    lineHeight: 18,
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
