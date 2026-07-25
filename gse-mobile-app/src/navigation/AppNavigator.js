import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import DashboardScreen from '../screens/DashboardScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
    return (
        <Drawer.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#0F172A',
                },
                headerTintColor: '#FFFFFF',
                drawerStyle: {
                    backgroundColor: '#0F172A',
                    width: 280,
                },
                drawerLabelStyle: {
                    color: '#FFFFFF',
                },
            }}
        >
            <Drawer.Screen name="Dashboard" component={DashboardScreen} />
        </Drawer.Navigator>
    );
};

const AuthNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
        </Stack.Navigator>
    );
};

const AppNavigator = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return null;
    }

    return (
        <NavigationContainer>
            {user ? <DrawerNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
};

export default AppNavigator;