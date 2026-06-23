import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Dimensions,
  ScrollView,
  Image
} from 'react-native';
import { useAuth } from '../utils/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation<any>();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Semua kolom harus diisi.');
      return;
    }
    if (password !== passwordConfirmation) {
      Alert.alert('Error', 'Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      
      Alert.alert('Sukses', 'Registrasi berhasil! Silakan login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error: any) {
      let errorMsg = 'Registrasi gagal.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMsg = error.response.data.message;
      }
      Alert.alert('Gagal', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Top Half - Image Background matching frontend exactly */}
      <View style={styles.topSection}>
        <ImageBackground
          source={require('../../assets/bg-login.jpeg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.imageOverlay} />
        </ImageBackground>
      </View>

      {/* Bottom Half - White Card */}
      <View style={styles.bottomSection}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandContainer}>
            <Image source={require('../../assets/profile.jpg')} style={styles.logoImage} />
            <Text style={styles.brandTitle}>CV. Citra Mandiri</Text>
          </View>
          <Text style={styles.mainTitle}>Buat Akun Baru</Text>
          <Text style={styles.subtitle}>
            Bergabunglah dengan layanan internet terbaik kami.
          </Text>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nama Lengkap"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#9ca3af" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Konfirmasi Password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Daftar Sekarang</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Sudah punya akun? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLink}>Masuk di sini</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topSection: {
    height: height * 0.35, // Shorter for register to give more room for inputs
    width: '100%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(37, 99, 235, 0.4)', // Blue overlay matching frontend theme
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: -40,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  logoImage: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2563eb', // Frontend blue theme color
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  formContainer: {
    width: '100%',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    backgroundColor: '#2563eb',
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  loginText: {
    color: '#64748b',
    fontSize: 14,
  },
  loginLink: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
