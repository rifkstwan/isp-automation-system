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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';

export default function OrderHistoryScreen() {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState<number | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await apiClient.get('/orders/my');
      setOrders(res.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'pending': return { bg: '#fef3c7', text: '#d97706' };
      case 'dibayar': return { bg: '#dbeafe', text: '#2563eb' };
      case 'aktif': return { bg: '#ecfdf5', text: '#10b981' };
      case 'nonaktif': return { bg: '#f1f5f9', text: '#64748b' };
      case 'ditolak': return { bg: '#fee2e2', text: '#ef4444' };
      default: return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const handlePay = async (orderId: number) => {
    setPaying(orderId);
    try {
      // 1. Ambil Snap Token dari Backend
      const res = await apiClient.post(`/orders/${orderId}/pay`);
      const snapToken = res.data.snap_token;

      if (!snapToken) {
        Alert.alert('Gagal', 'Tidak mendapatkan token pembayaran.');
        return;
      }

      // 2. Buka URL Midtrans Snap
      const paymentUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${snapToken}`;
      await WebBrowser.openBrowserAsync(paymentUrl);

      // 3. Refresh list setelah selesai bayar
      fetchOrders();
    } catch (error: any) {
      Alert.alert('Gagal', error.response?.data?.message || 'Gagal memproses pembayaran');
    } finally {
      setPaying(null);
    }
  };

  const handleDownloadInvoice = async (item: any) => {
    try {
      // 1. Get logo as Base64 safely (works in both dev Metro HTTP and prod File URI)
      const assetURI = Image.resolveAssetSource(require('../../assets/profile.jpg')).uri;
      const localUri = FileSystem.cacheDirectory + 'profile_logo.jpg';
      await FileSystem.downloadAsync(assetURI, localUri);
      const base64Data = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
      const logoBase64 = `data:image/jpeg;base64,${base64Data}`;

      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; position: relative; }
              .watermark { position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); opacity: 0.05; width: 300px; height: 300px; z-index: -1; pointer-events: none; }
              .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
              .logo-img { width: 80px; height: 80px; margin-bottom: 8px; border-radius: 40px; }
              .logo { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 5px; }
              .title { font-size: 24px; color: #1e293b; margin-top: 20px; font-weight: bold; }
              .info-box { display: flex; justify-content: space-between; margin-bottom: 40px; }
              .info-col { width: 45%; }
              .label { font-size: 12px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; font-weight: bold; }
              .value { font-size: 15px; font-weight: bold; color: #0f172a; margin-bottom: 15px; }
              .table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
              .table th { background-color: #f8fafc; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 13px; }
              .table td { padding: 15px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b; }
              .total-row td { font-weight: bold; font-size: 18px; color: #2563eb; border-top: 2px solid #e2e8f0; }
              .footer { text-align: center; font-size: 14px; color: #334155; margin-top: 60px; border-top: 2px solid #e2e8f0; padding-top: 24px; font-weight: 500; line-height: 1.6; }
              .status { display: inline-block; padding: 6px 12px; background-color: #ecfdf5; color: #10b981; border-radius: 4px; font-weight: bold; font-size: 12px; border: 1px solid #a7f3d0; }
            </style>
          </head>
          <body>
            <img src="${logoBase64}" class="watermark" />
            <div class="header">
              <img src="${logoBase64}" class="logo-img" />
              <div class="logo">CV. WIFI CITRA MANDIRI</div>
              <div style="color: #64748b; font-size: 14px;">Layanan Internet Cepat & Stabil</div>
              <div class="title">INVOICE PEMASANGAN BARU</div>
            </div>
            
            <div class="info-box">
              <div class="info-col">
                <div class="label">Ditagihkan Kepada:</div>
                <div class="value">${item.user?.name || 'Pelanggan'}</div>
                <div class="label">Alamat Pemasangan:</div>
                <div class="value">${item.alamat_pemasangan || item.alamat || '-'}</div>
              </div>
              <div class="info-col" style="text-align: right;">
                <div class="label">Nomor Pesanan:</div>
                <div class="value">INV-ORD-${item.id}-${new Date(item.created_at).getFullYear()}</div>
                <div class="label">Tanggal Lunas:</div>
                <div class="value">${new Date(item.tanggal_mulai || item.updated_at).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</div>
                <div class="label">Status:</div>
                <div class="value"><span class="status">LUNAS</span></div>
              </div>
            </div>
            
            <table class="table">
              <thead>
                <tr>
                  <th>Deskripsi Layanan</th>
                  <th style="text-align: right;">Jumlah Biaya</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Instalasi & Pemasangan Baru - ${item.paket?.nama || 'Paket Internet'}</td>
                  <td style="text-align: right;">${formatRupiah(item.total_harga)}</td>
                </tr>
                <tr class="total-row">
                  <td style="text-align: right; padding-right: 20px;">TOTAL LUNAS</td>
                  <td style="text-align: right;">${formatRupiah(item.total_harga)}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="footer">
              Terima kasih telah mempercayakan kebutuhan internet Anda pada <strong>CV. WiFi Citra Mandiri</strong>.<br/>
              <span style="color: #64748b; font-size: 12px; margin-top: 8px; display: inline-block;">Invoice ini sah dan diterbitkan secara otomatis oleh sistem.</span>
            </div>
          </body>
        </html>
      `;
      
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Unduh Invoice' });
    } catch (error) {
      console.error('Invoice Error:', error);
      Alert.alert('Error', 'Gagal membuat invoice PDF');
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusStyle = getStatusColor(item.status);
    const orderId = `#ORD-${item.id.toString().padStart(4, '0')}`;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <View style={styles.iconBox}>
              <Ionicons name="cube" size={16} color="#2563eb" />
            </View>
            <View style={styles.titleTextContainer}>
              <Text style={styles.paketName} numberOfLines={1}>{item.paket?.nama || 'Paket Custom'}</Text>
              <Text style={styles.orderId}>{orderId}</Text>
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
            <Text style={styles.infoLabel}>Biaya Bulanan</Text>
            <Text style={styles.priceText}>{formatRupiah(item.total_harga)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tgl Permintaan</Text>
            <Text style={styles.infoValue}>
              {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
          {item.tanggal_pasang && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tgl Instalasi</Text>
              <Text style={styles.infoValue}>
                {new Date(item.tanggal_pasang).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          )}
          
          <View style={styles.addressContainer}>
            <Ionicons name="location-outline" size={16} color="#64748b" style={styles.addressIcon} />
            <Text style={styles.addressText}>{item.alamat_pemasangan || item.alamat || '-'}</Text>
          </View>
        </View>
        
        {item.status?.toLowerCase() === 'pending' ? (
          <TouchableOpacity 
            style={[styles.payBtn, paying === item.id && { opacity: 0.7 }]}
            onPress={() => handlePay(item.id)}
            disabled={paying === item.id}
          >
            {paying === item.id ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.payBtnText}>Bayar Instalasi Pemasangan</Text>
            )}
          </TouchableOpacity>
        ) : item.status?.toLowerCase() === 'dibayar' || item.status?.toLowerCase() === 'aktif' || item.status?.toLowerCase() === 'selesai' ? (
          <TouchableOpacity 
            style={styles.invoiceBtn}
            onPress={() => handleDownloadInvoice(item)}
          >
            <Ionicons name="document-text-outline" size={18} color="#2563eb" />
            <Text style={styles.invoiceBtnText}>Unduh Invoice</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Pesanan</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cube-outline" size={48} color="#94a3b8" />
          </View>
          <Text style={styles.emptyTitle}>Belum Ada Pesanan</Text>
          <Text style={styles.emptyText}>Anda belum pernah melakukan pemesanan instalasi layanan WiFi baru.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
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
  paketName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  orderId: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
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
  cardBody: {},
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  priceText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  addressIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  payBtn: {
    backgroundColor: '#0f172a',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  payBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  invoiceBtn: {
    backgroundColor: '#eff6ff',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  invoiceBtnText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: 'bold',
  }
});
