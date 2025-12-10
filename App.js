import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Contexto
import AppProvider from './src/context/AppProvider';

// Ecrãs
import MainScreen from './src/screens/MainScreen';
import LibrariesScreen from './src/screens/LibrariesScreen';
import LibraryDetailScreen from './src/screens/LibraryDetailScreen';
import UsersScreen from './src/screens/UsersScreen';

const Stack = createNativeStackNavigator();

function RootNavigator() {
    return (
        <Stack.Navigator initialRouteName="Main">
            <Stack.Screen
                name="Main"
                component={MainScreen}
                options={{ title: 'Home', headerShown: false }}
            />
            <Stack.Screen
                name="Libraries"
                component={LibrariesScreen}
                options={{ title: 'Libraries' }}
            />
            <Stack.Screen
                name="LibraryDetail"
                component={LibraryDetailScreen}
                options={({ route }) => ({
                    title: route?.params?.libraryName || 'Library Detail',
                })}
            />
            <Stack.Screen
                name="Users"
                component={UsersScreen}
                options={{ title: 'Users' }}
            />
        </Stack.Navigator>
    );
}

export default function App() {
    const isDarkMode = useColorScheme() === 'dark';

    return (
        <SafeAreaProvider>
            <AppProvider>
                <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
                <NavigationContainer>
                    <RootNavigator />
                </NavigationContainer>
            </AppProvider>
        </SafeAreaProvider>
    );
}