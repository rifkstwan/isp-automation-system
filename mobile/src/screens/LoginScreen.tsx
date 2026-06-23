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

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigation = useNavigation<any>();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email dan password tidak boleh kosong.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      let errorMsg = 'Email atau password salah.';
      
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
         errorMsg = 'Tidak dapat terhubung ke server.\n\nPastikan:\n1. Backend Laravel berjalan dengan: php artisan serve --host=0.0.0.0\n2. iPhone & laptop di WiFi yang sama\n3. IP di file client.ts sudah benar.';
      } else if (error.response) {
         if (error.response.status === 404) {
           errorMsg = 'Endpoint API tidak ditemukan (404). Cek routing backend Anda.';
         } else if (error.response.status === 500) {
           errorMsg = 'Terjadi kesalahan internal di server Laravel (500).';
         } else if (error.response.data && error.response.data.message) {
           errorMsg = error.response.data.message;
         }
      }
      
      Alert.alert('Login Gagal', errorMsg);
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

      {/* Bottom Half - White Card (Asana Style) */}
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
          <Text style={styles.mainTitle}>Selamat Datang Kembali</Text>
          <Text style={styles.subtitle}>
            Silakan masuk untuk mengelola layanan internet dan mendapatkan penawaran luar biasa.
          </Text>

          <View style={styles.formContainer}>
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

            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => Alert.alert('Info', 'Fitur reset password belum tersedia.')}
            >
              <Text style={styles.forgotPasswordText}>Lupa Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Masuk Sekarang</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Belum punya akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Daftar di sini</Text>
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
    height: height * 0.45, // Takes up 45% of the screen
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
    marginTop: -40, // Pulls the white card up to overlap the image
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
    marginBottom: 16,
    gap: 12,
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  brandTitle: {
    fontSize: 22,
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
    marginBottom: 32,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  formContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc', // Very light blue/grey
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 60, // Taller inputs for modern look
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2563eb',
    width: '100%',
    height: 60,
    borderRadius: 30, // Fully rounded like Asana button
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto', // Pushes button to bottom if space allows
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#64748b',
    fontSize: 14,
  },
  registerLink: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
