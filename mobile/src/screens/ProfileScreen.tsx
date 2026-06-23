import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../utils/AuthContext';
import apiClient from '../api/client';

// Extract base URL from apiClient
const STORAGE_URL = apiClient.defaults.baseURL?.replace('/api', '/storage') || 'http://192.168.1.5:8000/storage';

export default function ProfileScreen({ isEmbedded = false, onBack }: { isEmbedded?: boolean, onBack?: () => void }) {
  const navigation = useNavigation<any>();
  const { logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/profile');
      const data = res.data;
      setForm({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
      });
      if (data.avatar) {
        setCurrentAvatarUrl(`${STORAGE_URL}/${data.avatar}`);
      }
    } catch (error) {
      Alert.alert('Gagal', 'Tidak dapat memuat data profil');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Akses Ditolak', 'Dibutuhkan akses ke galeri untuk mengubah foto profil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      Alert.alert('Error', 'Nama dan Email wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('_method', 'PUT'); // override method for Laravel
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('address', form.address);

      if (avatarUri) {
        const filename = avatarUri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formData.append('avatar', {
          uri: avatarUri,
          name: filename,
          type
        } as any);
      }

      const res = await apiClient.post('/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.user?.avatar) {
        setCurrentAvatarUrl(`${STORAGE_URL}/${res.data.user.avatar}`);
        setAvatarUri(null); // clear local selection
      }

      Alert.alert('Sukses', 'Profil berhasil diperbarui');
    } catch (error: any) {
      Alert.alert('Gagal', error.response?.data?.message || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Konfirmasi', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', onPress: logout, style: 'destructive' },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, isEmbedded && { paddingTop: 0, backgroundColor: 'transparent' }]}>
      <View style={[styles.header, isEmbedded && { backgroundColor: 'transparent', borderBottomWidth: 0, paddingHorizontal: 20 }]}>
        <TouchableOpacity onPress={() => onBack ? onBack() : navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Akun</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={isEmbedded ? { paddingBottom: 120 } : {}}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.formContainer}>
              
              <View style={styles.avatarSection}>
                <TouchableOpacity style={styles.avatarCircle} onPress={pickImage}>
                  {avatarUri || currentAvatarUrl ? (
                    <Image 
                      source={{ uri: avatarUri || currentAvatarUrl || '' }} 
                      style={styles.avatarImage} 
                    />
                  ) : (
                    <Text style={styles.avatarText}>{form.name.substring(0, 2).toUpperCase()}</Text>
                  )}
                  <View style={styles.editIconBadge}>
                    <Ionicons name="camera" size={14} color="#fff" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.userName}>{form.name}</Text>
                <Text style={styles.userEmail}>{form.email}</Text>
              </View>

              <Text style={styles.label}>Nama Lengkap</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={(text) => setForm({ ...form, name: text })}
                  placeholder="Masukkan nama lengkap"
                />
              </View>

              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={form.email}
                  onChangeText={(text) => setForm({ ...form, email: text })}
                  placeholder="Masukkan email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.label}>Nomor Telepon / WhatsApp</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={form.phone}
                  onChangeText={(text) => setForm({ ...form, phone: text })}
                  placeholder="Contoh: 081234567890"
                  keyboardType="phone-pad"
                />
              </View>

              <Text style={styles.label}>Alamat Pemasangan</Text>
              <View style={[styles.inputContainer, { height: 80, alignItems: 'flex-start', paddingTop: 12 }]}>
                <Ionicons name="location-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { height: '100%', textAlignVertical: 'top' }]}
                  value={form.address}
                  onChangeText={(text) => setForm({ ...form, address: text })}
                  placeholder="Masukkan alamat lengkap rumah Anda"
                  multiline
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                <Text style={styles.logoutBtnText}>Keluar Akun</Text>
              </TouchableOpacity>

            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: { flex: 1 },
  formContainer: { padding: 20 },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0f172a',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
