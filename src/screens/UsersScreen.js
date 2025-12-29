import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppContext from '../context/AppContext';
import { fetchCheckedOutBooks, fetchCheckoutHistory } from '../context/userActions';
import { BASE_URL } from '../service/service';

export default function UsersScreen() {
    const { state, dispatch } = useContext(AppContext);

    // Estados globais vindo do AppProvider
    const {
        checkedOutBooks = [],
        checkoutHistory = [],
        checkedOutLoading,
        historyLoading,
        checkedOutError,
        historyError
    } = state;

    const [searchId, setSearchId] = useState('');

    const isLoading = checkedOutLoading || historyLoading;

    // Função para buscar dados nos dois endpoints específicos
    const handleSearch = () => {
        if (!searchId.trim()) {
            return Alert.alert("Aviso", "Insira um ID de utilizador");
        }
        fetchCheckedOutBooks(dispatch, searchId.trim());
        fetchCheckoutHistory(dispatch, searchId.trim());
    };

    // Lógica de extração de imagem baseada no teu BookCard.js
    const buildCoverUrl = (cover) => {
        const rel = cover?.smallUrl || cover?.mediumUrl || cover?.largeUrl;
        if (!rel) return null;
        const imageId = rel.split('?')[0].split('/').pop();
        return `${BASE_URL.replace(/\/$/, '')}/v1/assets/cover/${imageId}`;
    };

    const renderBookCard = (item, isCurrent) => {
        const book = item.book || {};
        const coverUrl = buildCoverUrl(book.cover);
        const authorName = Array.isArray(book.authors)
            ? book.authors.map(a => a.name).join(', ')
            : 'Autor desconhecido';

        return (
            <TouchableOpacity
                key={item.id || Math.random().toString()}
                style={[styles.card, isCurrent ? styles.currentCard : styles.pastCard]}
                activeOpacity={0.8}
            >
                {coverUrl ? (
                    <Image source={{ uri: coverUrl }} style={styles.cover} />
                ) : (
                    <View style={styles.coverFallback}>
                        <Text style={styles.fallbackText}>No Cover</Text>
                    </View>
                )}

                <View style={styles.info}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.bookTitle} numberOfLines={1}>
                            {book.title || item.bookTitle || 'Sem Título'}
                        </Text>
                        {isCurrent && (
                            <View style={styles.badge}><Text style={styles.badgeText}>EM POSSE</Text></View>
                        )}
                    </View>

                    <Text style={styles.author} numberOfLines={1}>{authorName}</Text>

                    <View style={styles.details}>
                        <Text style={styles.dateText}> Requisitado: {item.checkoutDate || 'N/A'}</Text>
                        <Text style={[styles.dateText, isCurrent && styles.dueDate]}>
                             Entrega: {item.dueDate?.split('T')[0] || 'N/A'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.headerTitle}>Painel do Utilizador</Text>

            <View style={styles.searchBox}>
                <TextInput
                    style={styles.input}
                    placeholder="ID do Utilizador (ex: 123)"
                    placeholderTextColor="#64748b"
                    value={searchId}
                    onChangeText={setSearchId}
                    keyboardType="numeric"
                />
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                    <Text style={styles.searchBtnText}>BUSCAR</Text>
                </TouchableOpacity>
            </View>

            {(checkedOutError || historyError) && (
                <Text style={styles.errorText}>Erro ao carregar dados. Verifique o ID.</Text>
            )}

            {isLoading ? (
                <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={[
                        { title: ' LIVROS ATUAIS', data: checkedOutBooks, current: true },
                        { title: ' HISTÓRICO DE DEVOLUÇÕES', data: checkoutHistory, current: false }
                    ]}
                    keyExtractor={item => item.title}
                    renderItem={({ item }) => (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{item.title} ({item.data?.length || 0})</Text>
                            {(!item.data || item.data.length === 0) ? (
                                <Text style={styles.emptyText}>Sem registos nesta secção.</Text>
                            ) : (
                                item.data.map((book) => renderBookCard(book, item.current))
                            )}
                        </View>
                    )}
                    contentContainerStyle={{ paddingBottom: 40 }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0b1220', padding: 20 },
    headerTitle: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 20 },
    searchBox: { flexDirection: 'row', gap: 10, marginBottom: 30 },
    input: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 15, color: '#fff', borderWidth: 1, borderColor: '#334155' },
    searchBtn: { backgroundColor: '#2563eb', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 12 },
    searchBtnText: { color: '#fff', fontWeight: 'bold' },
    section: { marginBottom: 25 },
    sectionTitle: { color: '#3b82f6', fontSize: 13, fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 },
    card: { flexDirection: 'row', backgroundColor: '#111827', borderRadius: 12, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#1f2937' },
    currentCard: { borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
    pastCard: { opacity: 0.8 },
    cover: { width: 70, height: 100, backgroundColor: '#1e293b' },
    coverFallback: { width: 70, height: 100, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
    fallbackText: { color: '#475569', fontSize: 10, textAlign: 'center' },
    info: { flex: 1, padding: 12, justifyContent: 'center' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    bookTitle: { color: '#f8fafc', fontSize: 15, fontWeight: 'bold', flex: 1, marginRight: 5 },
    author: { color: '#94a3b8', fontSize: 13, marginBottom: 8 },
    badge: { backgroundColor: '#1d4ed8', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
    details: { borderTopWidth: 1, borderTopColor: '#1f2937', paddingTop: 6 },
    dateText: { color: '#64748b', fontSize: 11 },
    dueDate: { color: '#fbbf24', fontWeight: 'bold' },
    emptyText: { color: '#475569', fontSize: 12, fontStyle: 'italic', marginLeft: 10 },
    errorText: { color: '#ef4444', textAlign: 'center', marginBottom: 10 }
});