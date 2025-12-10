// src/screens/LibrariesScreen.js
import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import AppContext from '../context/AppContext';
import { fetchLibraries } from '../context/libraryActions';

const LibrariesScreen = () => {
  const navigation = useNavigation();
  const { state, dispatch } = useContext(AppContext);
  const { libraries, librariesLoading, librariesError } = state;

  const [searchQuery, setSearchQuery] = useState('');

  // equivalente ao fetchLibraries() do Android -> chama ao montar
  useEffect(() => {
    fetchLibraries(dispatch);
  }, [dispatch]);

  // equivalente ao filter(String query)
  const filteredLibraries = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return libraries;

    return libraries.filter((lib) => {
      const name = (lib.name || '').toLowerCase();
      return name.includes(q);
    });
  }, [libraries, searchQuery]);

  const safe = (s) => {
    if (!s || s.trim() === '') return 'N/A';
    return s;
  };

  const handlePressLibrary = (lib) => {
    // equivalente ao Intent para LibraryDetailActivity
    navigation.navigate('LibraryDetail', {
      libraryId: lib.id,
      libraryName: lib.name,
    });
  };

  const renderLibraryItem = ({ item: lib }) => {
    const isOpen = !!lib.open; // backend devolve boolean "open"
    const backgroundStyle = isOpen
        ? styles.libraryOpen
        : styles.libraryClosed;

    return (
        <TouchableOpacity
            style={[styles.libraryCard, backgroundStyle]}
            onPress={() => handlePressLibrary(lib)}
        >
          <Text style={styles.libraryText}>
            Library Name: {safe(lib.name)}
          </Text>
          <Text style={styles.libraryText}>
            Address: {safe(lib.address)}
          </Text>
          <Text style={styles.libraryText}>
            Open Status: {isOpen ? 'Open' : 'Closed'}
          </Text>
          <Text style={styles.libraryText}>
            Open Days: {safe(lib.openDays)}
          </Text>
        </TouchableOpacity>
    );
  };

  return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.title}>Libraries</Text>

          {/* Barra de pesquisa (equivalente à lupa do menu) */}
          <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar biblioteca..."
              value={searchQuery}
              onChangeText={setSearchQuery}
          />

          {librariesLoading && <ActivityIndicator size="large" />}

          {librariesError && !librariesLoading && (
              <Text style={styles.error}>Erro: {librariesError}</Text>
          )}

          {!librariesLoading && !librariesError && (
              <FlatList
                  data={filteredLibraries}
                  keyExtractor={(item) => item.id}
                  renderItem={renderLibraryItem}
                  contentContainerStyle={styles.listContent}
              />
          )}

          {/*
          Aqui mais tarde podemos pôr um “Bottom bar” ou botões para:
          - Add Library (equivalente ao bottomNav action_add)
          - Edit/Delete (action_edit)
          Por agora, foco na listagem + pesquisa + navegação.
        */}
        </View>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#121212', // fundo escuro para os cards brilharem
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  libraryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  libraryOpen: {
    backgroundColor: '#2e7d32', // verde
  },
  libraryClosed: {
    backgroundColor: '#616161', // cinzento
  },
  libraryText: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 4,
  },
  error: {
    color: 'red',
    marginTop: 8,
  },
});

export default LibrariesScreen;