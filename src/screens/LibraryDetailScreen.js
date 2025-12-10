import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';

const LibraryDetailScreen = () => {
    const route = useRoute();
    const { libraryId, libraryName } = route.params || {};

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{libraryName || 'Library Detail'}</Text>
            <Text style={styles.text}>ID: {libraryId}</Text>

            {/*
        Mais tarde:
        - chamar API getLibraryById(libraryId)
        - mostrar detalhes completos
        - botÃ£o para ver livros dessa biblioteca
      */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 12,
    },
    text: {
        fontSize: 16,
    },
});

export default LibraryDetailScreen;