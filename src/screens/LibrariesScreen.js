// src/screens/LibrariesScreen.js
import React, { useContext, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppContext from '../context/AppContext';
import { fetchLibraries } from '../context/libraryActions';

const LibrariesScreen = () => {
  const { state, dispatch } = useContext(AppContext);

  const { libraries, librariesLoading, librariesError } = state;

  useEffect(() => {
    // chama a API quando o ecrã monta
    fetchLibraries(dispatch);
  }, [dispatch]);

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.address}>{item.address}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Bibliotecas</Text>

        {librariesLoading && <ActivityIndicator size="large" />}

        {librariesError && !librariesLoading && (
          <Text style={styles.error}>Erro: {librariesError}</Text>
        )}

        {!librariesLoading && !librariesError && (
          <FlatList
            data={libraries}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  address: {
    fontSize: 14,
    color: '#555',
  },
  error: {
    marginTop: 8,
    color: 'red',
  },
});

export default LibrariesScreen;
