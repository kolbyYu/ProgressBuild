import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Import screen components
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import JobScreen from '../screens/JobScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoadingScreen from '../components/LoadingScreen';
import SplashScreen from '../components/SplashScreen';
import ClockInScreen from '../screens/ClockInScreen';
import NewRecordScreen from '../screens/NewRecordScreen';
import JobRecordsScreen from '../screens/JobRecordsScreen';
import JobRecordDetailScreen from '../screens/JobRecordDetailScreen';
import UserJobRecordsScreen from '../screens/UserJobRecordsScreen';

// Import settings screens
import NotificationsScreen from '../screens/NotificationsScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import AboutScreen from '../screens/AboutScreen';

import { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Main app tab navigator
const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Job') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#757575',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: Math.max(25, insets.bottom + 5),
          paddingTop: 5,
          height: Math.max(80, 60 + insets.bottom),
        },
      })}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Job"
        component={JobScreen}
        options={{
          tabBarLabel: 'Jobs',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// Main navigator
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen message="Checking login status..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="ClockIn" component={ClockInScreen} options={{ headerShown: true, title: 'Clock In/Out' }} />
            <Stack.Screen name="NewRecord" component={NewRecordScreen} options={{ headerShown: false }} />
            <Stack.Screen name="JobRecords" component={JobRecordsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="JobRecordDetail" component={JobRecordDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="UserJobRecords" component={UserJobRecordsScreen} options={{ headerShown: false }} />
            
            {/* Settings Screens */}
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} options={{ headerShown: false }} />
            <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
