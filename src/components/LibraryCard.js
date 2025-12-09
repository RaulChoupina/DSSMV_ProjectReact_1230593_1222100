import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const LibraryCard = ({ library, onPress }) => {
    // A API retorna 'open' como true/false
    const isOpen = library.open;

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.header}>
                <Text style={styles.name}>{library.name}</Text>
                {/* Badge de Aberto/Fechado */}
                <View style={[styles.badge, { backgroundColor: isOpen ? '#4CAF50' : '#F44336' }]}>
                    <Text style={styles.badgeText}>{isOpen ? 'Aberto' : 'Fechado'}</Text>
                </View>
            </View>

            <Text style={styles.address}>{library.address}</Text>

            {/* Exemplo: "Aberto das 09:00 às 18:00" - Ajustar conforme formato de LocalTime da API */}
            <Text style={styles.hours}>
                {library.openTime?.hour}:{library.openTime?.minute || '00'} - {library.closeTime?.hour}:{library.closeTime?.minute || '00'}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 8,
        elevation: 3, // Sombra no Android
        shadowColor: '#000', // Sombra no iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    address: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    hours: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export default LibraryCard;