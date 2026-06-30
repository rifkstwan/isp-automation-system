import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform,
  Image,
  ImageBackground,
  Animated
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../utils/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../api/client';

import TicketScreen from './TicketScreen';
import ProfileScreen from './ProfileScreen';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  
  // App SPA State
  const [activeTab, setActiveTab] = useState('Home');

  // Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tagihan, setTagihan] = useState<any>(null);
  const [paying, setPaying] = useState<number | null>(null);
  const [traffic, setTraffic] = useState<any>(null);
  const [pakets, setPakets] = useState<any[]>([]);
  
  // Order States
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [currentPaket, setCurrentPaket] = useState<any>(null);
  const [pendingOrder, setPendingOrder] = useState<any>(null);

  // Upgrade Modal State
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [selectedPaketId, setSelectedPaketId] = useState<number | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  const [activePromo, setActivePromo] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const promos = [
    { id: '1', title: 'Promo Spesial WiFi Mandiri', sub: 'Diskon Pemasangan Baru & Upgrade!' },
    { id: '2', title: 'Ajak Teman Dapat Diskon', sub: 'Dapatkan cashback 50rb per referal' },
    { id: '3', title: 'Upgrade Speed Murah', sub: 'Hanya tambah 50rb/bulan' },
  ];

  const menuItems = [
    { id: '1', title: 'Jadwal\nTeknisi', icon: 'calendar-check', color: '#14b8a6', bg: '#f0fdfa', type: 'font-awesome', screen: 'Schedule' },
    { id: '2', title: 'Riwayat\nPesanan', icon: 'history', color: '#8b5cf6', bg: '#f5f3ff', type: 'font-awesome', screen: 'OrderHistory' },
    { id: '3', title: 'Testimoni', icon: 'comment-dots', color: '#f59e0b', bg: '#fffbeb', type: 'font-awesome', screen: 'Testimonial' },
    { id: '4', title: 'Upgrade\nSpeed', icon: 'rocket', color: '#f97316', bg: '#fff7ed', type: 'font-awesome', action: () => setUpgradeModalVisible(true) },
  ];

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActivePromo(Math.round(index));
  };

  const fetchData = async () => {
    try {
      // Tagihan
      const billingsRes = await apiClient.get('/my-billings');
      const unpaidBillings = billingsRes.data?.filter((b: any) => b.status === 'unpaid') || [];
      setTagihan(unpaidBillings.length > 0 ? unpaidBillings[0] : null);

      // Orders
      try {
        const ordersRes = await apiClient.get('/orders/my');
        const activeOrders = ordersRes.data?.filter((o: any) => o.status === 'aktif' || o.status === 'dibayar');
        if (activeOrders && activeOrders.length > 0) {
          setHasActiveOrder(true);
          setOrderId(activeOrders[0].id);
          setCurrentPaket(activeOrders[0].paket);
        } else {
          setHasActiveOrder(false);
          setOrderId(null);
          setCurrentPaket(null);
        }

        const pendingList = ordersRes.data?.filter((o: any) => o.status === 'pending') || [];
        setPendingOrder(pendingList.length > 0 ? pendingList[0] : null);
      } catch (e) {
        setHasActiveOrder(false);
        setPendingOrder(null);
      }

      // Notifications
      try {
        const notifRes = await apiClient.get('/notifications');
        const unread = notifRes.data?.filter((n: any) => n.read_at === null) || [];
        setUnreadCount(unread.length);
      } catch (e) {
        setUnreadCount(0);
      }

      // Traffic
      try {
        const trafficRes = await apiClient.get('/traffic/my');
        setTraffic(trafficRes.data);
      } catch (e) {
        setTraffic({ usage_gb: 0, limit_gb: 'Unlimited' });
      }

      // Pakets
      try {
        const paketsRes = await apiClient.get('/pakets');
        setPakets(paketsRes.data || []);
      } catch (e) {
        setPakets([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const handlePay = async (billingId: number) => {
    setPaying(billingId);
    try {
      const res = await apiClient.post(`/billings/${billingId}/pay`);
      const snapToken = res.data.snap_token;
      if (!snapToken) {
        Alert.alert('Gagal', 'Tidak mendapatkan token pembayaran.');
        return;
      }
      const paymentUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${snapToken}`;
      await WebBrowser.openBrowserAsync(paymentUrl);
      fetchData();
    } catch (error: any) {
      Alert.alert('Gagal', error.response?.data?.message || 'Gagal memproses pembayaran');
    } finally {
      setPaying(null);
    }
  };

  const handleUpgrade = async () => {
    if (!orderId) {
      Alert.alert('Gagal', 'Anda belum memiliki layanan yang aktif.');
      return;
    }
    if (!selectedPaketId) {
      Alert.alert('Perhatian', 'Silakan pilih paket baru terlebih dahulu.');
      return;
    }
    
    // Cegah downgrade atau paket sama
    if (currentPaket && currentPaket.id === selectedPaketId) {
      Alert.alert('Perhatian', 'Paket yang dipilih sama dengan paket Anda saat ini.');
      return;
    }

    setUpgrading(true);
    try {
      await apiClient.post(`/orders/${orderId}/upgrade`, {
        new_paket_id: selectedPaketId
      });
      Alert.alert('Berhasil', 'Permintaan upgrade paket berhasil dikirim. Admin kami akan segera memprosesnya.');
      setUpgradeModalVisible(false);
      setSelectedPaketId(null);
    } catch (error: any) {
      Alert.alert('Gagal', error.response?.data?.message || 'Gagal mengajukan permintaan upgrade.');
    } finally {
      setUpgrading(false);
    }
  };

  const initial = user?.name?.substring(0, 2)?.toUpperCase() ?? 'US';

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  // ==================== TAB RENDERERS ====================

  const renderHomeContent = () => (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={{ paddingBottom: 140 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => setActiveTab('Profil')}>
          <Text style={styles.avatarText}>{initial}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Search')}>
          <Ionicons name="search" size={18} color="#9ca3af" />
          <Text style={[styles.searchInput, { color: '#9ca3af' }]}>Cari Layanan / Bantuan...</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notification')}>
          <Ionicons name="notifications-outline" size={24} color="#111827" />
          {unreadCount > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.promoContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={{ width: width - 32 }}
        >
          {promos.map((promo, idx) => {
            const promoBgs = [
              'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
              'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
              'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80'
            ];
            return (
            <View key={promo.id} style={styles.promoSlide}>
              <ImageBackground 
                source={{ uri: promoBgs[idx % promoBgs.length] }} 
                style={[styles.promoImagePlaceholder, { padding: 0, overflow: 'hidden', backgroundColor: '#1e293b' }]}
                imageStyle={{ opacity: 1 }}
              >
                <LinearGradient colors={['rgba(15, 23, 42, 0.3)', 'rgba(15, 23, 42, 0.85)']} style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                  <Text style={styles.promoText}>{promo.title}</Text>
                  <Text style={styles.promoSub}>{promo.sub}</Text>
                </LinearGradient>
              </ImageBackground>
            </View>
            );
          })}
        </ScrollView>
        <View style={styles.dotContainer}>
          {promos.map((_, index) => (
            <View key={index} style={[styles.dot, activePromo === index && styles.dotActive]} />
          ))}
        </View>
      </View>

      <View style={styles.gridContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.gridItem}
            onPress={() => item.action ? item.action() : navigation.navigate(item.screen)}
          >
            <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
              <FontAwesome5 name={item.icon} size={20} color={item.color} />
            </View>
            <Text style={styles.gridText} numberOfLines={2} textAlign="center">{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80' }}
        style={[styles.accountCard, { padding: 0 }]}
        imageStyle={{ borderRadius: 24, opacity: 1 }}
      >
        <LinearGradient colors={['rgba(15, 23, 42, 0.5)', 'rgba(15, 23, 42, 0.9)']} style={{ padding: 24, borderRadius: 24 }}>
          <View style={styles.cardHeader}>
            <View style={styles.accountTypeBox}>
              <Text style={styles.accountTypeText}>CV. Citra Mandiri</Text>
            </View>
            <Text style={styles.accountId}>ID: {user?.id ? `CM-0${user.id}` : 'CM-0000'}</Text>
            <View style={{flex: 1}}/>
            <View style={styles.poinBox}>
              <FontAwesome5 name="check-circle" size={12} color="#10b981" />
              <Text style={styles.poinText}> {hasActiveOrder ? 'Aktif' : 'Non-Aktif'}</Text>
            </View>
          </View>
          
          <Text style={styles.periodeText}>Hai, {user?.name || 'Pelanggan'}</Text>

          <View style={styles.cardBody}>
            <View style={styles.cardCol}>
              <Text style={styles.cardLabel}>Tagihan Bulan Ini</Text>
              {loading ? (
                <ActivityIndicator size="small" color="#2563eb" style={{ alignSelf: 'flex-start' }} />
              ) : (
                <>
                  <Text style={styles.cardValue}>{tagihan ? formatRupiah(tagihan.amount) : 'Rp 0'}</Text>
                  <TouchableOpacity style={styles.bayarBtnRow} onPress={() => navigation.navigate('Billing')}>
                    <Text style={[styles.bayarBtnText, !tagihan && { color: '#10b981' }]}>
                      {tagihan ? 'Bayar Sekarang' : 'Sudah Lunas'}
                    </Text>
                    {tagihan && <Ionicons name="chevron-forward" size={14} color="#2563eb" />}
                  </TouchableOpacity>
                </>
              )}
            </View>
            
            <View style={styles.cardDivider} />
            
            <View style={styles.cardCol}>
              <Text style={styles.cardLabel}>Pemakaian Traffic</Text>
              {loading ? (
                <ActivityIndicator size="small" color="#2563eb" style={{ alignSelf: 'flex-start' }} />
              ) : (
                <>
                  <Text style={styles.cardValueTraffic}>
                    {traffic?.usage_gb ?? '0'} <Text style={styles.cardValueUnit}>GB</Text>
                  </Text>
                  <Text style={styles.cardDesc}>Kuota {traffic?.limit_gb || 'Unlimited'}</Text>
                </>
              )}
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Penawaran Layanan</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Order')}>
          <Text style={styles.sectionLink}>Lihat Semua</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollRow}>
        {loading ? (
            <ActivityIndicator size="large" color="#2563eb" style={{ margin: 20 }} />
        ) : pakets.length > 0 ? (
          pakets.map((paket, idx) => {
            const bgImages = [
              'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80',
              'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=800&q=80',
              'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=800&q=80',
              'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=800&q=80'
            ];
            const bgImg = bgImages[idx % bgImages.length];
            return (
              <ImageBackground 
                key={paket.id} 
                source={{ uri: bgImg }}
                style={[styles.offerCard, { padding: 0, backgroundColor: '#1e293b', borderColor: 'transparent', height: 190 }]}
                imageStyle={{ borderRadius: 20, opacity: 1 }}
              >
                <LinearGradient colors={['rgba(15, 23, 42, 0.2)', 'rgba(15, 23, 42, 0.9)']} style={{ padding: 20, flex: 1, justifyContent: 'flex-end', borderRadius: 20 }}>
                  <Text style={[styles.offerTitle, { color: '#bfdbfe' }]}>{paket.nama}</Text>
                  <Text style={[styles.offerSpeed, { color: '#ffffff' }]}>{paket.kecepatan} Mbps</Text>
                  <Text style={[styles.offerDesc, { color: '#e2e8f0' }]} numberOfLines={2}>{paket.deskripsi || 'Internet cepat stabil'}</Text>
                  <Text style={[styles.offerPrice, { color: '#60a5fa' }]}>{formatRupiah(paket.harga)}</Text>
                </LinearGradient>
              </ImageBackground>
            );
          })
        ) : (
          <Text style={{color: '#94a3b8', fontStyle: 'italic'}}>Belum ada paket tersedia.</Text>
        )}
      </ScrollView>
    </ScrollView>
  );

  const renderPaketContent = () => (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={{ paddingBottom: 220 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { flex: 1, textAlign: 'center', fontSize: 20, color: '#0f172a', fontWeight: '900' }]}>
          Layanan Internet Anda
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : !hasActiveOrder ? (
        <View style={{ padding: 16 }}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=800&q=80' }} 
            style={[styles.premiumCard, { backgroundColor: '#0f172a', minHeight: 280 }]}
            imageStyle={{ borderRadius: 32, opacity: 1 }}
          >
            <LinearGradient colors={['rgba(15, 23, 42, 0.5)', 'rgba(15, 23, 42, 0.95)']} style={[styles.premiumCardGradient, { alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: 30 }]}>
              <View style={[styles.premiumIconGlow, { width: 70, height: 70, borderRadius: 35, marginBottom: 16 }]}>
                <Ionicons name="wifi-outline" size={32} color="#60a5fa" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#ffffff', marginTop: 8 }}>Belum Ada Paket Aktif</Text>
              <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 20, paddingHorizontal: 16 }}>
                Anda belum berlangganan layanan WiFi Citra Mandiri. Pasang sekarang dan nikmati internet cepat tanpa batas!
              </Text>
              <TouchableOpacity style={[styles.primaryBtn, { width: '100%', backgroundColor: '#2563eb', borderColor: '#3b82f6', borderWidth: 1 }]} onPress={() => navigation.navigate('Order')}>
                <Text style={styles.primaryBtnText}>Berlangganan Sekarang</Text>
              </TouchableOpacity>
            </LinearGradient>
          </ImageBackground>
        </View>
      ) : (
        <View style={{ padding: 16 }}>
          
          {/* Main Hero Card (Dark Premium UI) */}
          <ImageBackground 
            source={{ uri: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=800&q=80' }}  
            style={[styles.premiumCard, { backgroundColor: '#0f172a' }]}
            imageStyle={{ borderRadius: 32, opacity: 1 }}
          >
            <LinearGradient colors={['rgba(15, 23, 42, 0.4)', 'rgba(15, 23, 42, 0.9)']} style={styles.premiumCardGradient}>
              <View style={styles.premiumHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={styles.premiumIconGlow}>
                    <Ionicons name="globe-outline" size={26} color="#60a5fa" />
                  </View>
                  <View>
                    <Text style={styles.premiumSubtext}>Status Koneksi</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <View style={[styles.statusLiveDot, { backgroundColor: '#60a5fa' }]} />
                      <Text style={{ color: '#60a5fa', fontSize: 14, fontWeight: '800' }}>
                        AKTIF / PEMASANGAN
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>{currentPaket?.nama || 'Unknown'}</Text>
                </View>
              </View>

              <View style={styles.speedGaugeContainer}>
                <Ionicons name="speedometer" size={40} color="#60a5fa" style={{ marginBottom: 8 }} />
                <Text style={styles.speedGaugeValue}>{currentPaket?.kecepatan || 0}</Text>
                <Text style={styles.speedGaugeUnit}>Mbps</Text>
              </View>

              <View style={styles.premiumStatsRow}>
                <View style={styles.premiumStatBox}>
                  <Ionicons name="cloud-download-outline" size={18} color="#94a3b8" />
                  <Text style={styles.premiumStatLabel}>Pemakaian</Text>
                  <Text style={styles.premiumStatValue}>{traffic?.usage_gb || 0} <Text style={{fontSize: 12}}>GB</Text></Text>
                </View>
                <View style={styles.premiumStatDivider} />
                <View style={styles.premiumStatBox}>
                  <Ionicons name="infinite" size={18} color="#94a3b8" />
                  <Text style={styles.premiumStatLabel}>Kuota</Text>
                  <Text style={styles.premiumStatValue}>{traffic?.limit_gb || 'Unlimited'}</Text>
                </View>
                <View style={styles.premiumStatDivider} />
                <View style={styles.premiumStatBox}>
                  <Ionicons name="wallet-outline" size={18} color="#94a3b8" />
                  <Text style={styles.premiumStatLabel}>Biaya / Bulan</Text>
                  <Text style={[styles.premiumStatValue, { fontSize: 13, color: '#fcd34d' }]}>{currentPaket ? formatRupiah(currentPaket.harga) : 'Rp 0'}</Text>
                </View>
              </View>

            </LinearGradient>
          </ImageBackground>

          <Text style={{ fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 16, marginTop: 24, marginLeft: 4 }}>Tingkatkan Pengalaman</Text>
          
          <TouchableOpacity style={styles.upgradeBanner} onPress={() => setUpgradeModalVisible(true)}>
            <ImageBackground
              source={{ uri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80' }}
              style={{ flex: 1, backgroundColor: '#f59e0b', overflow: 'hidden', borderRadius: 24 }}
              imageStyle={{ opacity: 1 }}
            >
              <LinearGradient colors={['rgba(245, 158, 11, 0.4)', 'rgba(180, 83, 9, 0.9)']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.upgradeBannerGrad}>
                <View style={styles.upgradeBannerLeft}>
                  <Ionicons name="rocket" size={28} color="#fff" />
                  <View style={{ marginLeft: 16 }}>
                    <Text style={styles.upgradeBannerTitle}>Kurang Cepat?</Text>
                    <Text style={styles.upgradeBannerSub}>Upgrade layanan sekarang tanpa ribet!</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>

        </View>
      )}
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'Home': return renderHomeContent();
      case 'Paket': return renderPaketContent();
      case 'Tiket': return <TicketScreen isEmbedded={true} />;
      case 'Profil': return <ProfileScreen isEmbedded={true} onBack={() => setActiveTab('Home')} />;
      default: return renderHomeContent();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      
      {/* Background Gradient for All Tabs */}
      <LinearGradient colors={['#e0e7ff', '#f1f5f9', '#f8fafc']} style={styles.mainContainer}>
        <View style={[styles.bgCircle, styles.bgCircle1]} />
        <View style={[styles.bgCircle, styles.bgCircle2]} />
        <View style={[styles.bgCircle, styles.bgCircle3]} />
        <SafeAreaView style={styles.safeArea}>
          {renderContent()}
        </SafeAreaView>
      </LinearGradient>

      {/* STICKY BILLING NOTIFICATION BAR (Appears on Paket Tab if there's an unpaid bill) */}
      {tagihan && activeTab === 'Paket' && (
        <View style={styles.stickyBillingNav}>
          <View style={styles.stickyBillingContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.stickyBillingTitle}>Tagihan Bulan Ini</Text>
              <Text style={styles.stickyBillingAmount}>{formatRupiah(tagihan.amount)}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.stickyBillingBtn, paying === tagihan.id && { opacity: 0.7 }]} 
              onPress={() => handlePay(tagihan.id)}
              disabled={paying === tagihan.id}
            >
              {paying === tagihan.id ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="card" size={18} color="#ffffff" />
                  <Text style={styles.stickyBillingBtnText}>Bayar via Midtrans</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STICKY INSTALLATION NOTIFICATION BAR (Appears if there's a pending installation order) */}
      {pendingOrder && !tagihan && activeTab === 'Home' && (
        <View style={styles.stickyBillingNav}>
          <View style={[styles.stickyBillingContent, { backgroundColor: '#f59e0b', shadowColor: '#f59e0b' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.stickyBillingTitle}>Bayar Instalasi Baru</Text>
              <Text style={styles.stickyBillingAmount}>{formatRupiah(pendingOrder.total_harga)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.stickyBillingBtn} 
              onPress={() => navigation.navigate('OrderHistory')}
            >
              <Ionicons name="card" size={18} color="#f59e0b" />
              <Text style={[styles.stickyBillingBtnText, { color: '#f59e0b' }]}>Bayar Sekarang</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modern Floating Bottom Navigation */}
      <View style={styles.floatingNavContainer}>
        <View style={styles.floatingNavGlass}>
          
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Home')}>
            <Ionicons name={activeTab === 'Home' ? "home" : "home-outline"} size={24} color={activeTab === 'Home' ? "#2563eb" : "#64748b"} />
            <Text style={[styles.navText, activeTab === 'Home' && styles.navTextActive]}>Beranda</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Paket')}>
            <Ionicons name={activeTab === 'Paket' ? "wifi" : "wifi-outline"} size={24} color={activeTab === 'Paket' ? "#2563eb" : "#64748b"} />
            <Text style={[styles.navText, activeTab === 'Paket' && styles.navTextActive]}>Paket</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Tiket')}>
            <Ionicons name={activeTab === 'Tiket' ? "document-text" : "document-text-outline"} size={24} color={activeTab === 'Tiket' ? "#2563eb" : "#64748b"} />
            <Text style={[styles.navText, activeTab === 'Tiket' && styles.navTextActive]}>Tiket</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Profil')}>
            <Ionicons name={activeTab === 'Profil' ? "person" : "person-outline"} size={24} color={activeTab === 'Profil' ? "#2563eb" : "#64748b"} />
            <Text style={[styles.navText, activeTab === 'Profil' && styles.navTextActive]}>Profil</Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* Upgrade Speed Modal */}
      <Modal visible={upgradeModalVisible} animationType="slide" transparent={true} onRequestClose={() => setUpgradeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.dragHandle} />
            <Text style={styles.modalTitle}>Upgrade Speed Layanan</Text>
            <Text style={styles.modalSubtitle}>Pilih paket baru yang lebih cepat dan stabil untuk memenuhi kebutuhan digital Anda.</Text>
            
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {pakets.map((p) => {
                const isActive = currentPaket && currentPaket.id === p.id;
                const isSelected = selectedPaketId === p.id;
                return (
                  <TouchableOpacity 
                    key={p.id} 
                    style={[styles.upgradeCard, isSelected && styles.upgradeCardSelected, isActive && { opacity: 0.5 }]}
                    onPress={() => {
                      if (!isActive) setSelectedPaketId(p.id);
                    }}
                    disabled={isActive}
                  >
                    <View style={styles.upgradeCardLeft}>
                      <Ionicons name={isSelected ? "radio-button-on" : "radio-button-off"} size={24} color={isSelected ? "#2563eb" : "#cbd5e1"} />
                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.upgradeCardTitle}>{p.nama} {isActive && '(Saat Ini)'}</Text>
                        <Text style={styles.upgradeCardSpeed}>{p.kecepatan} Mbps</Text>
                      </View>
                    </View>
                    <Text style={styles.upgradeCardPrice}>{formatRupiah(p.harga)}</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setUpgradeModalVisible(false)}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalSubmitBtn, (!selectedPaketId || upgrading) && { opacity: 0.6 }]} 
                onPress={handleUpgrade}
                disabled={!selectedPaketId || upgrading}
              >
                {upgrading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Kirim Permintaan</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  bgCircle: { position: 'absolute', borderRadius: 999, opacity: 0.5 },
  bgCircle1: { width: 350, height: 350, backgroundColor: '#bfdbfe', top: -150, right: -100 },
  bgCircle2: { width: 250, height: 250, backgroundColor: '#e2e8f0', top: 150, left: -120, opacity: 0.6 },
  bgCircle3: { width: 200, height: 200, backgroundColor: '#f1f5f9', bottom: 50, right: -80, opacity: 0.8 },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  container: { flex: 1, backgroundColor: 'transparent' },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'transparent', gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', height: 44, borderRadius: 22, paddingHorizontal: 16, gap: 8, shadowColor: '#000', shadowOffset:{width:0, height:2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  iconBtn: { position: 'relative', padding: 4 },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#ef4444', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#ffffff' },
  badgeText: { color: '#ffffff', fontSize: 9, fontWeight: 'bold' },

  // Promo
  promoContainer: { paddingHorizontal: 16, marginTop: 8, alignItems: 'center' },
  promoSlide: { width: width - 32 },
  promoImagePlaceholder: { width: '100%', height: 140, backgroundColor: '#2563eb', borderRadius: 24, justifyContent: 'center', alignItems: 'center', padding: 20, shadowColor: '#2563eb', shadowOffset: {width:0, height:8}, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  promoText: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  promoSub: { color: '#bfdbfe', fontSize: 14, marginTop: 4 },
  dotContainer: { flexDirection: 'row', marginTop: 12, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#cbd5e1' },
  dotActive: { width: 20, backgroundColor: '#1e293b' },

  // Grid Menu
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, marginTop: 20 },
  gridItem: { width: '25%', alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 60, height: 60, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: '#64748b', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  gridText: { fontSize: 12, color: '#475569', fontWeight: '600', textAlign: 'center', lineHeight: 16 },

  // Account Card
  accountCard: { marginHorizontal: 16, marginTop: 8, backgroundColor: '#0f172a', borderRadius: 24, padding: 24, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  accountTypeBox: { backgroundColor: '#2563eb', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  accountTypeText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  accountId: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  poinBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  poinText: { color: '#34d399', fontSize: 11, fontWeight: 'bold' },
  periodeText: { color: '#94a3b8', fontSize: 14, marginBottom: 24 },
  cardBody: { flexDirection: 'row', alignItems: 'flex-start' },
  cardCol: { flex: 1 },
  cardDivider: { width: 1, height: '100%', backgroundColor: '#334155', marginHorizontal: 16 },
  cardLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 6 },
  cardValue: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  cardValueTraffic: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  cardValueUnit: { fontSize: 14, fontWeight: 'normal', color: '#cbd5e1' },
  bayarBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  bayarBtnText: { color: '#60a5fa', fontSize: 13, fontWeight: 'bold' },
  cardDesc: { color: '#94a3b8', fontSize: 11, marginTop: 10 },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 32, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  sectionLink: { fontSize: 13, color: '#2563eb', fontWeight: '700' },
  scrollRow: { paddingHorizontal: 16, gap: 16 },
  offerCard: { width: 150, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff', shadowColor: '#64748b', shadowOffset:{width:0, height:4}, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  offerTitle: { fontSize: 13, color: '#64748b', fontWeight: '700', marginBottom: 10 },
  offerSpeed: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  offerDesc: { fontSize: 11, color: '#94a3b8', marginBottom: 16, lineHeight: 16 },
  offerPrice: { fontSize: 15, fontWeight: '800', color: '#2563eb' },

  // Paket Tab Premium Redesign
  premiumCard: { borderRadius: 32, overflow: 'hidden', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 12 },
  premiumCardGradient: { padding: 24 },
  premiumHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  premiumIconGlow: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(96, 165, 250, 0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(96, 165, 250, 0.3)' },
  premiumSubtext: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  premiumBadge: { backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  premiumBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  speedGaugeContainer: { alignItems: 'center', marginVertical: 16 },
  speedGaugeValue: { fontSize: 56, fontWeight: '900', color: '#ffffff', lineHeight: 60 },
  speedGaugeUnit: { fontSize: 16, color: '#60a5fa', fontWeight: 'bold', letterSpacing: 1 },
  premiumStatsRow: { flexDirection: 'row', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: 20, padding: 16, marginTop: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
  premiumStatBox: { flex: 1, alignItems: 'center', gap: 6 },
  premiumStatLabel: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  premiumStatValue: { color: '#f8fafc', fontSize: 16, fontWeight: '800' },
  premiumStatDivider: { width: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', height: '80%', alignSelf: 'center' },
  upgradeBanner: { borderRadius: 20, overflow: 'hidden', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  upgradeBannerGrad: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  upgradeBannerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  upgradeBannerTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  upgradeBannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },

  // Sticky Billing Notification Bar
  stickyBillingNav: { position: 'absolute', bottom: Platform.OS === 'ios' ? 105 : 95, left: 16, right: 16, zIndex: 10 },
  stickyBillingContent: { flexDirection: 'row', backgroundColor: '#ef4444', borderRadius: 20, padding: 16, alignItems: 'center', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  stickyBillingTitle: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  stickyBillingAmount: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  stickyBillingBtn: { flexDirection: 'row', backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignItems: 'center', gap: 6 },
  stickyBillingBtnText: { color: '#ef4444', fontSize: 13, fontWeight: 'bold' },

  // Floating Bottom Navigation
  floatingNavContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    backgroundColor: 'transparent',
  },
  floatingNavGlass: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    height: 75,
    borderRadius: 36,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  navItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  navTextActive: {
    color: '#2563eb',
    fontWeight: '800',
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  dragHandle: { width: 40, height: 5, backgroundColor: '#cbd5e1', borderRadius: 3, alignSelf: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#64748b', lineHeight: 22, marginBottom: 24 },
  upgradeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  upgradeCardSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  upgradeCardLeft: { flexDirection: 'row', alignItems: 'center' },
  upgradeCardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  upgradeCardSpeed: { fontSize: 13, color: '#64748b', marginTop: 4 },
  upgradeCardPrice: { fontSize: 15, fontWeight: '800', color: '#2563eb' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalCancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center' },
  modalCancelText: { color: '#64748b', fontSize: 16, fontWeight: 'bold' },
  modalSubmitBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: '#2563eb', alignItems: 'center' },
  modalSubmitText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
