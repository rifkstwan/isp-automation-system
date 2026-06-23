import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/utils/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import RegisterScreen from './src/screens/RegisterScreen';

// Skeletons for Backend Features
import ProfileScreen from './src/screens/ProfileScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import SearchScreen from './src/screens/SearchScreen';
import BillingScreen from './src/screens/BillingScreen';
import TicketScreen from './src/screens/TicketScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import OrderHistoryScreen from './src/screens/OrderHistoryScreen';
import TestimonialScreen from './src/screens/TestimonialScreen';
import OrderScreen from './src/screens/OrderScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Notification" component={NotificationScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="Billing" component={BillingScreen} />
          <Stack.Screen name="Ticket" component={TicketScreen} />
          <Stack.Screen name="Schedule" component={ScheduleScreen} />
          <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
          <Stack.Screen name="Testimonial" component={TestimonialScreen} />
          <Stack.Screen name="Order" component={OrderScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
});
