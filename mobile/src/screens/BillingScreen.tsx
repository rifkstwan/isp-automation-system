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

export default function BillingScreen() {
  const navigation = useNavigation<any>();
  const [billings, setBillings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState<number | null>(null);

  const fetchBillings = async () => {
    try {
      const res = await apiClient.get('/my-billings');
      setBillings(res.data || []);
    } catch (error) {
      console.error('Error fetching billings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBillings();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBillings();
  }, []);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const handlePay = async (billingId: number) => {
    setPaying(billingId);
    try {
      // 1. Ambil Snap Token dari Backend
      const res = await apiClient.post(`/billings/${billingId}/pay`);
      const snapToken = res.data.snap_token;

      if (!snapToken) {
        Alert.alert('Gagal', 'Tidak mendapatkan token pembayaran.');
        return;
      }

      // 2. Buka URL Midtrans Snap via In-App Browser (Sandbox Mode)
      // Catatan: Jika ingin ke production, hapus '.sandbox' pada URL
      const paymentUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${snapToken}`;
      await WebBrowser.openBrowserAsync(paymentUrl);

      // 3. Refresh list setelah browser ditutup untuk melihat status terbaru
      fetchBillings();
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
              <div class="title">INVOICE PEMBAYARAN</div>
            </div>
            
            <div class="info-box">
              <div class="info-col">
                <div class="label">Ditagihkan Kepada:</div>
                <div class="value">${item.user?.name || item.order?.user?.name || 'Pelanggan'}</div>
              </div>
              <div class="info-col" style="text-align: right;">
                <div class="label">Nomor Tagihan:</div>
                <div class="value">INV-BIL-${item.id}-${new Date().getFullYear()}</div>
                <div class="label">Tanggal Bayar:</div>
                <div class="value">${new Date(item.tanggal_bayar || item.updated_at).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</div>
                <div class="label">Status:</div>
                <div class="value"><span class="status">LUNAS</span></div>
              </div>
            </div>
            
            <table class="table">
              <thead>
                <tr>
                  <th>Deskripsi Layanan</th>
                  <th style="text-align: right;">Jumlah Tagihan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Tagihan Bulanan - ${item.order?.paket?.nama || 'Paket Internet'}</td>
                  <td style="text-align: right;">${formatRupiah(item.jumlah_tagihan)}</td>
                </tr>
                <tr class="total-row">
                  <td style="text-align: right; padding-right: 20px;">TOTAL LUNAS</td>
                  <td style="text-align: right;">${formatRupiah(item.jumlah_tagihan)}</td>
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
    console.log('DEBUG BILLING STATUS:', item.status);
    const isPaid = item.status?.toLowerCase() === 'paid';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.packageBox}>
            <Ionicons name="wifi" size={16} color="#2563eb" style={{ marginRight: 6 }} />
            <Text style={styles.packageText}>{item.order?.paket?.nama || 'Paket Internet'}</Text>
          </View>
          <View style={[styles.statusBadge, isPaid ? styles.statusPaid : styles.statusUnpaid]}>
            <Text style={[styles.statusText, isPaid ? styles.statusTextPaid : styles.statusTextUnpaid]}>
              {isPaid ? 'LUNAS' : 'BELUM BAYAR'}
            </Text>
          </View>
        </View>

        <View style={styles.dashedLineContainer}>
          {Array.from({ length: 30 }).map((_, i) => (
            <View key={i} style={styles.dashItem} />
          ))}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Batas Pembayaran</Text>
            <Text style={styles.infoValue}>
              {new Date(item.jatuh_tempo).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Tagihan</Text>
            <Text style={styles.priceValue}>{formatRupiah(item.jumlah_tagihan)}</Text>
          </View>
        </View>

        {!isPaid ? (
          <TouchableOpacity 
            style={[styles.payBtn, paying === item.id && { opacity: 0.7 }]}
            onPress={() => handlePay(item.id)}
            disabled={paying === item.id}
          >
            {paying === item.id ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.payBtnText}>Bayar Sekarang</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.invoiceBtn}
            onPress={() => handleDownloadInvoice(item)}
          >
            <Ionicons name="document-text-outline" size={18} color="#2563eb" />
            <Text style={styles.invoiceBtnText}>Unduh Invoice</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tagihan Saya</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : billings.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="receipt-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyText}>Tidak ada riwayat tagihan</Text>
        </View>
      ) : (
        <FlatList
          data={billings}
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
  
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  packageBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusUnpaid: {
    backgroundColor: '#fef2f2',
  },
  statusPaid: {
    backgroundColor: '#ecfdf5',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusTextUnpaid: {
    color: '#ef4444',
  },
  statusTextPaid: {
    color: '#10b981',
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
  cardBody: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0f172a',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  payBtn: {
    backgroundColor: '#0f172a', // Sleek dark button for modern UI
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  payBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  invoiceBtn: {
    backgroundColor: '#eff6ff',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
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
