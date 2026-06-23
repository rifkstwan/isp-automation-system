import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query);
      } else {
        setResults([]);
        setHasSearched(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await apiClient.get(`/search?q=${searchQuery}`);
      setResults(res.data || []);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type: string) => {
    switch(type) {
      case 'user': return 'person-outline';
      case 'ticket': return 'headset-outline';
      case 'order': return 'cube-outline';
      case 'notification': return 'notifications-outline';
      default: return 'search-outline';
    }
  };

  const handlePressItem = (item: any) => {
    // Basic mapping from backend web URLs to Mobile Screens
    const url = item.url || '';
    if (url.includes('tickets')) navigation.navigate('Ticket');
    else if (url.includes('billing')) navigation.navigate('Billing');
    else if (url.includes('schedule')) navigation.navigate('Schedule');
    else if (url.includes('services') || url.includes('orders')) navigation.navigate('OrderHistory');
    else if (url.includes('notifications')) navigation.navigate('Notification');
    else if (url.includes('profile')) navigation.navigate('Profile');
    else if (url.includes('order')) navigation.navigate('Order');
    else if (url.includes('dashboard')) navigation.navigate('Dashboard');
    else {
      // Fallback
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => handlePressItem(item)}>
      <View style={styles.iconContainer}>
        <Ionicons name={getIconForType(item.type)} size={20} color="#2563eb" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>{item.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari Layanan / Bantuan..."
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#cbd5e1" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : hasSearched && results.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="search-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>Tidak ditemukan hasil untuk "{query}"</Text>
          </View>
        ) : !hasSearched ? (
          <View style={styles.centerContainer}>
            <Ionicons name="search-circle-outline" size={80} color="#f1f5f9" />
            <Text style={[styles.emptyText, { color: '#94a3b8' }]}>Ketik minimal 2 huruf untuk mencari</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            keyboardShouldPersistTaps="handled"
          />
        )}
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
  backBtn: { padding: 4, marginRight: 12 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
  },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { color: '#64748b', marginTop: 12, fontSize: 14, textAlign: 'center' },
  listContainer: { padding: 16 },
  
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748b',
  }
});
