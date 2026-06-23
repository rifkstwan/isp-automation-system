import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Untuk emulator Android gunakan: http://10.0.2.2:8000/api
// Untuk perangkat fisik (iPhone/Android), ganti dengan IP laptop Anda
// Contoh: http://192.168.1.44:8000/api
const BASE_URL = 'http://192.168.1.5:8000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Otomatis sisipkan token di setiap request
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Tangani error global
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
