import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  roles: string[];
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/login', payload);
    await AsyncStorage.setItem('auth_token', response.data.token);
    return response.data;
  },
  logout: async (): Promise<void> => {
    await apiClient.post('/logout');
    await AsyncStorage.removeItem('auth_token');
  },
  getProfile: async () => {
    const response = await apiClient.get('/me');
    return response.data;
  },
};

export const billingApi = {
  getAll: async () => {
    const response = await apiClient.get('/billing');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await apiClient.get(`/billing/${id}`);
    return response.data;
  },
  pay: async (id: number) => {
    const response = await apiClient.post(`/billing/${id}/pay`);
    return response.data;
  },
};

export const customerApi = {
  getAll: async () => {
    const response = await apiClient.get('/customers');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },
};

export const reportApi = {
  getSummary: async () => {
    const response = await apiClient.get('/reports/summary');
    return response.data;
  },
};
