import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';

export default function TestimonialScreen() {
  const navigation = useNavigation<any>();
  const [testimonial, setTestimonial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTestimonial = async () => {
    try {
      const res = await apiClient.get('/testimonials/my');
      setTestimonial(res.data || null);
    } catch (error) {
      console.error('Error fetching testimonial:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTestimonial();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTestimonial();
  }, []);

  const openModal = () => {
    if (testimonial) {
      setRating(testimonial.rating || 5);
      setContent(testimonial.content || testimonial.pesan || '');
    } else {
      setRating(5);
      setContent('');
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Perhatian', 'Pesan ulasan tidak boleh kosong.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/testimonials', {
        rating,
        content
      });
      Alert.alert('Sukses', 'Terima kasih atas ulasan Anda!');
      setModalVisible(false);
      fetchTestimonial();
    } catch (error: any) {
      Alert.alert('Gagal', error.response?.data?.message || 'Gagal mengirim ulasan.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count: number, size = 16) => {
    return Array(5).fill(0).map((_, i) => (
      <Ionicons 
        key={i} 
        name={i < count ? "star" : "star-outline"} 
        size={size} 
        color={i < count ? "#fbbf24" : "#e2e8f0"} 
        style={{ marginRight: 4 }}
      />
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ulasan Pelanggan</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : !testimonial ? (
          <View style={styles.emptyCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="star" size={40} color="#fbbf24" />
            </View>
            <Text style={styles.emptyTitle}>Bagikan Pengalaman Anda</Text>
            <Text style={styles.emptyDesc}>
              Bantu kami untuk terus meningkatkan layanan dengan memberikan ulasan jujur tentang pengalaman Anda menggunakan WiFi Citra Mandiri.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={openModal}>
              <Text style={styles.primaryBtnText}>Mulai Tulis Ulasan</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.reviewCard}>
            {/* Watermark Quote */}
            <Ionicons name="chatbubbles" size={100} color="#f1f5f9" style={styles.watermarkQuote} />
            
            <View style={styles.reviewHeader}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color="#2563eb" />
                </View>
                <View>
                  <Text style={styles.userName}>Ulasan Anda</Text>
                  <Text style={styles.reviewDate}>
                    {new Date(testimonial.updated_at || testimonial.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.statusBadge, testimonial.is_published ? styles.statusPub : styles.statusPen]}>
                <View style={[styles.statusDot, testimonial.is_published ? {backgroundColor: '#10b981'} : {backgroundColor: '#d97706'}]} />
                <Text style={[styles.statusText, testimonial.is_published ? styles.statusTextPub : styles.statusTextPen]}>
                  {testimonial.is_published ? 'Publik' : 'Review'}
                </Text>
              </View>
            </View>

            <View style={styles.starsContainer}>
              {renderStars(testimonial.rating, 22)}
            </View>

            <Text style={styles.messageText}>{testimonial.content || testimonial.pesan}</Text>
            
            <View style={styles.divider} />

            <TouchableOpacity style={styles.editBtn} onPress={openModal}>
              <Ionicons name="create-outline" size={18} color="#2563eb" style={{ marginRight: 6 }} />
              <Text style={styles.editBtnText}>Edit Ulasan</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modal Form Ulasan */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.dragHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{testimonial ? 'Edit Ulasan Anda' : 'Tulis Ulasan Baru'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.ratingSection}>
                <Text style={styles.ratingSubtitle}>Seberapa puas Anda dengan layanan kami?</Text>
                <View style={styles.ratingSelect}>
                  {Array(5).fill(0).map((_, i) => (
                    <TouchableOpacity key={i} onPress={() => setRating(i + 1)} activeOpacity={0.7}>
                      <Ionicons 
                        name={i < rating ? "star" : "star-outline"} 
                        size={44} 
                        color={i < rating ? "#fbbf24" : "#cbd5e1"} 
                        style={{ marginHorizontal: 8 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Ceritakan Pengalaman Anda</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: Koneksinya sangat stabil dan teknisinya ramah..."
                    placeholderTextColor="#94a3b8"
                    value={content}
                    onChangeText={setContent}
                    multiline
                    textAlignVertical="top"
                    maxLength={1000}
                  />
                </View>
                <Text style={styles.charCount}>{(content || '').length}/1000</Text>
              </View>

              <TouchableOpacity 
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Simpan Ulasan</Text>
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
    paddingHorizontal: 16, 
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9',
    justifyContent: 'space-between'
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  scrollContent: { flexGrow: 1, padding: 24 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Empty State
  emptyCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 24, 
    padding: 32, 
    alignItems: 'center',
    shadowColor: '#64748b', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 16, 
    elevation: 2,
    marginTop: 20
  },
  iconCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#fef3c7', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 12, textAlign: 'center' },
  emptyDesc: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  primaryBtn: { 
    flexDirection: 'row', 
    backgroundColor: '#2563eb', 
    width: '100%',
    paddingVertical: 16, 
    borderRadius: 16, 
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 8, 
    elevation: 4
  },
  primaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

  // Filled State (Review Card)
  reviewCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 24, 
    padding: 24, 
    shadowColor: '#64748b', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 16, 
    elevation: 2, 
    position: 'relative',
    overflow: 'hidden'
  },
  watermarkQuote: { position: 'absolute', top: -10, right: 10, opacity: 0.4 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, zIndex: 1 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  userName: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  reviewDate: { fontSize: 13, color: '#64748b' },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusPub: { backgroundColor: '#ecfdf5' },
  statusPen: { backgroundColor: '#fef3c7' },
  statusText: { fontSize: 12, fontWeight: '700' },
  statusTextPub: { color: '#10b981' },
  statusTextPen: { color: '#d97706' },
  
  starsContainer: { flexDirection: 'row', marginBottom: 16, zIndex: 1 },
  messageText: { fontSize: 16, color: '#334155', lineHeight: 26, marginBottom: 24, zIndex: 1 },
  
  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 16 },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#eff6ff' },
  editBtnText: { color: '#2563eb', fontSize: 15, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, maxHeight: '90%' },
  dragHandle: { width: 40, height: 5, backgroundColor: '#cbd5e1', borderRadius: 3, alignSelf: 'center', marginBottom: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  closeBtn: { padding: 6, backgroundColor: '#f1f5f9', borderRadius: 20 },
  
  ratingSection: { alignItems: 'center', marginBottom: 32 },
  ratingSubtitle: { fontSize: 15, color: '#64748b', marginBottom: 16 },
  ratingSelect: { flexDirection: 'row', justifyContent: 'center' },
  
  inputSection: { marginBottom: 32 },
  inputLabel: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  inputWrapper: { backgroundColor: '#f8fafc', borderRadius: 20, height: 160, borderWidth: 1, borderColor: '#f1f5f9' },
  input: { flex: 1, fontSize: 16, color: '#1e293b', padding: 20, lineHeight: 24 },
  charCount: { alignSelf: 'flex-end', fontSize: 12, color: '#94a3b8', marginTop: 8 },
  
  submitBtn: { backgroundColor: '#2563eb', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: Platform.OS === 'ios' ? 20 : 0 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' }
});
