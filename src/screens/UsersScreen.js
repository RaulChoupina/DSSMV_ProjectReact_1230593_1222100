import React, { useContext, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AppContext from '../context/AppContext';
// Importa a action real aqui
import { fetchUsers } from '../context/userActions';

export default function UserScreen() {
    const navigation = useNavigation();
    const { state, dispatch } = useContext(AppContext);

    // Desestruturação do estado global
    const { users, usersLoading, usersError } = state;
    const [search, setSearch] = useState('');

    useEffect(() => {
        // Chamada à API para carregar a lista de utilizadores ao montar o componente
        fetchUsers(dispatch);
    }, [dispatch]);

    // Lógica de filtragem local por nome ou email
    const filteredUsers = (users || []).filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    const renderUser = ({ item }) => (
        <TouchableOpacity
            style={styles.userCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('UserDetail', {
                userId: item.id,
                userName: item.name
            })}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
            </View>

            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email || 'Sem email associado'}</Text>
            </View>

            <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text style={styles.title}>Utilizadores</Text>

                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Procurar utilizador..."
                        placeholderTextColor="#9ca3af"
                        value={search}
                        onChangeText={setSearch}
                        autoCorrect={false}
                    />
                </View>

                {usersLoading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#2563eb" />
                        <Text style={styles.loadingText}>A carregar utilizadores...</Text>
                    </View>
                ) : usersError ? (
                    <View style={styles.center}>
                        <Text style={styles.errorText}>Erro: {usersError}</Text>
                        <TouchableOpacity
                            style={styles.retryBtn}
                            onPress={() => fetchUsers(dispatch)}
                        >
                            <Text style={styles.retryBtnText}>Tentar Novamente</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={filteredUsers}
                        keyExtractor={item => String(item.id)}
                        renderItem={renderUser}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.center}>
                                <Text style={styles.empty}>Nenhum utilizador encontrado.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // --- ESTRUTURA ---
    safe: {
        flex: 1,
        backgroundColor: '#0b1220',
    },
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },

    // --- TEXTOS ---
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 16,
    },
    empty: {
        color: '#9ca3af',
        fontSize: 16,
    },
    loadingText: {
        color: '#9ca3af',
        marginTop: 10,
    },
    errorText: {
        color: '#f87171',
        marginBottom: 15,
        textAlign: 'center',
    },

    // --- BUSCA ---
    searchContainer: {
        marginBottom: 20,
    },
    searchInput: {
        backgroundColor: '#111827',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#1f2937',
        fontSize: 16,
    },

    // --- LISTA ---
    listContent: {
        paddingBottom: 20,
    },
    userCard: {
        flexDirection: 'row',
        backgroundColor: '#111827',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1f2937',
        // Sombras para iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        // Sombra para Android
        elevation: 3,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#2563eb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 20,
    },
    userInfo: {
        flex: 1,
        marginLeft: 16,
    },
    userName: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
        marginBottom: 2,
    },
    userEmail: {
        color: '#9ca3af',
        fontSize: 14,
    },
    arrow: {
        color: '#3b82f6',
        fontSize: 26,
        fontWeight: '300',
        marginLeft: 8,
    },

    // --- BOTÃO REPETIR ---
    retryBtn: {
        backgroundColor: '#1f2937',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3b82f6',
    },
    retryBtnText: {
        color: '#3b82f6',
        fontWeight: 'bold',
    },
});
