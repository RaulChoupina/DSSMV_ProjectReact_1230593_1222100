import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MainScreen = ({ navigation }) => {

    const renderButton = (title, route, icon) => (
        <Pressable
            onPress={() => navigation.navigate(route)}
            style={({ pressed }) => [
                styles.cardButton,
                pressed && styles.cardPressed
            ]}
        >
            <View style={styles.iconContainer}>
                <Icon name={icon} size={26} color="#4DA3FF" />
            </View>

            <Text style={styles.cardText}>{title}</Text>

            <Icon name="chevron-right" size={26} color="#666" />
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.title}>Library In One Click</Text>
                <Text style={styles.subtitle}>
                    Sistema de gestão de bibliotecas
                </Text>
            </View>

            {/* ACTIONS */}
            <View style={styles.actions}>
                {renderButton(
                    'Bibliotecas',
                    'Libraries',
                    'local-library'
                )}

                {renderButton(
                    'Utilizadores',
                    'Users',
                    'people'
                )}
            </View>
        </View>
    );
};



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0b1220', // fundo principal
    },

    /* HEADER */
    header: {
        paddingTop: 80,
        paddingBottom: 40,
        paddingHorizontal: 24,
        backgroundColor: '#0f172a', // azul muito escuro
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#e5e7eb',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#9ca3af',
        lineHeight: 22,
    },

    /* ACTIONS */
    actions: {
        padding: 24,
        gap: 20,
    },

    cardButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111827',
        borderRadius: 14,
        paddingVertical: 18,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#1f2933',
    },
    cardPressed: {
        backgroundColor: '#0f172a',
        transform: [{ scale: 0.98 }],
    },

    iconContainer: {
        width: 46,
        height: 46,
        borderRadius: 12,
        backgroundColor: '#0b1d33',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },

    cardText: {
        flex: 1,
        fontSize: 18,
        color: '#e5e7eb',
        fontWeight: '500',
    },
});

export default MainScreen;