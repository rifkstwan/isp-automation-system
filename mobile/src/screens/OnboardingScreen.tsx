import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
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
        <View style={styles.brandContainer}>
          <Image source={require('../../assets/profile.jpg')} style={styles.logoImage} />
          <Text style={styles.brandTitle}>CV. Citra Mandiri</Text>
        </View>
        <Text style={styles.mainTitle}>Solusi Internet Terbaik Untuk Anda</Text>
        <Text style={styles.subtitle}>
          Jelajahi koneksi tanpa batas untuk mendukung kehidupan digital Anda bersama CV. Citra Mandiri.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topSection: {
    height: height * 0.55, // 55% of the screen for the big image like Asana
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
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2563eb', // Frontend blue theme color
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 'auto',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#2563eb',
    width: '100%',
    height: 60,
    borderRadius: 30, // Fully rounded like Asana button
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
