import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AppProvider from './src/context/AppProvider';
import LibrariesScreen from './src/screens/LibrariesScreen'; // ajusta o caminho/extensão se precisares

const Stack = createNativeStackNavigator();

function RootNavigator() {
  return (
    <Stack.Navigator>
      {/* Ecrã inicial: lista de bibliotecas */}
      <Stack.Screen
        name="Libraries"
        component={LibrariesScreen}
        options={{ title: 'Bibliotecas' }}
      />

      {/*
        Quando criares mais ecrãs, adicionas aqui, por exemplo:
        <Stack.Screen name="LibraryBooks" component={LibraryBooksScreen} />
        <Stack.Screen name="BookDetails" component={BookDetailsScreen} />
      */}
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
