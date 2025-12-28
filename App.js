// src/App.js
import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AppProvider from './src/context/AppProvider';
import MainScreen from './src/screens/MainScreen';
import LibrariesScreen from './src/screens/LibrariesScreen';
import LibraryDetailScreen from './src/screens/LibraryDetailScreen';
import UsersScreen from './src/screens/UsersScreen';
import UserDetailScreen from './src/screens/UserDetailScreen'; // Adicionado

const Stack = createNativeStackNavigator();

function RootNavigator() {
    return (
        <Stack.Navigator initialRouteName="Main">
            <Stack.Screen name="Main" component={MainScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Libraries" component={LibrariesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="LibraryDetail" component={LibraryDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Users" component={UsersScreen} options={{ headerShown: false }} />
            {/* Registro obrigatório para a navegação funcionar */}
            <Stack.Screen name="UserDetail" component={UserDetailScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <AppProvider>
                <StatusBar barStyle="light-content" />
                <NavigationContainer>
                    <RootNavigator />
                </NavigationContainer>
            </AppProvider>
        </SafeAreaProvider>
    );
}