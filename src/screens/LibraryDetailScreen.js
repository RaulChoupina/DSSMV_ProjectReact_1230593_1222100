import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TextInput,
    TouchableOpacity,
    Image,
    Modal,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';

import AppContext from '../context/AppContext';
import { fetchLibraryBooks } from '../context/bookActions';
import { BASE_URL, makeHTTPRequest } from '../service/service';

const safe = (s) => (s && String(s).trim() ? String(s) : 'N/A');

export default function LibraryDetailScreen() {
    const route = useRoute();
    const { libraryId, libraryName } = route.params || {};

    const { state, dispatch } = useContext(AppContext);
    const { libraryBooks, libraryBooksLoading, libraryBooksError } = state;

    const [query, setQuery] = useState('');

    /* ADD */
    const [showAddModal, setShowAddModal] = useState(false);
    const [addIsbn, setAddIsbn] = useState('');
    const [addStock, setAddStock] = useState('1');
    const [savingAdd, setSavingAdd] = useState(false);

    /* EDIT */
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [editStock, setEditStock] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    /* DESCRIPTION POPUP */
    const [showDescModal, setShowDescModal] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);

    useEffect(() => {
        if (libraryId != null) fetchLibraryBooks(dispatch, libraryId);
    }, [dispatch, libraryId]);

    const filteredBooks = useMemo(() => {
        const q = (query || '').toLowerCase();
        if (!q) return libraryBooks || [];

        return (libraryBooks || []).filter((item) => {
            const b = item.book ?? item;
            const title = (b.title ?? '').toLowerCase();
            const isbn = (b.isbn ?? '').toLowerCase();
            const authors =
                Array.isArray(b.authors)
                    ? b.authors.map(a => a?.name).join(', ').toLowerCase()
                    : '';
            return title.includes(q) || isbn.includes(q) || authors.includes(q);
        });
    }, [libraryBooks, query]);

    /* COVER */
    const buildCoverUrl = (cover) => {
        const rel = cover?.smallUrl || cover?.mediumUrl || cover?.largeUrl;
        if (!rel) return null;
        const id = rel.split('?')[0].split('/').pop();
        return `${BASE_URL.replace(/\/$/, '')}/v1/assets/cover/${id}`;
    };

    /* API */
    const apiCreateBook = (isbn, payload) =>
        new Promise((resolve, reject) => {
            makeHTTPRequest(
                `/v1/library/${libraryId}/book/${encodeURIComponent(isbn)}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                },
                resolve,
                (e) => reject(new Error(e))
            );
        });

    const apiUpdateBook = (isbn, payload) =>
        new Promise((resolve, reject) => {
            makeHTTPRequest(
                `/v1/library/${libraryId}/book/${encodeURIComponent(isbn)}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                },
                resolve,
                (e) => reject(new Error(e))
            );
        });

    const handleAdd = async () => {
        const isbn = addIsbn.trim();
        const stock = parseInt(addStock, 10);
        if (!isbn || isNaN(stock)) return Alert.alert('Erro', 'Dados inválidos');

        setSavingAdd(true);
        try {
            await apiCreateBook(isbn, { stock, available: stock });
            fetchLibraryBooks(dispatch, libraryId);
            setShowAddModal(false);
            setAddIsbn('');
            setAddStock('1');
        } catch (e) {
            Alert.alert('Erro', safe(e.message));
        } finally {
            setSavingAdd(false);
        }
    };

    const openEditModal = (item) => {
        setSelectedItem(item);
        setEditStock(String(item.stock ?? 0));
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        const isbn = selectedItem?.book?.isbn ?? selectedItem?.isbn;
        const stock = parseInt(editStock, 10);
        if (!isbn || isNaN(stock)) return;

        setSavingEdit(true);
        try {
            await apiUpdateBook(isbn, { stock });
            fetchLibraryBooks(dispatch, libraryId);
            setShowEditModal(false);
        } catch (e) {
            Alert.alert('Erro', safe(e.message));
        } finally {
            setSavingEdit(false);
        }
    };

    const renderBookItem = ({ item }) => {
        const b = item.book;
        const coverUrl = buildCoverUrl(b?.cover);

        return (
            <TouchableOpacity
                style={styles.bookCard}
                activeOpacity={0.9}
                onPress={() => {
                    setSelectedBook(item);
                    setShowDescModal(true);
                }}
            >
                <View style={styles.coverWrap}>
                    {coverUrl ? (
                        <Image source={{ uri: coverUrl }} style={styles.cover} />
                    ) : (
                        <View style={styles.coverFallback}>
                            <Text style={styles.coverFallbackText}>No{'\n'}Cover</Text>
                        </View>
                    )}
                </View>

                <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle} numberOfLines={2}>
                        {safe(b?.title)}
                    </Text>
                    <Text style={styles.bookMeta} numberOfLines={2}>
                        {safe(
                            Array.isArray(b?.authors)
                                ? b.authors.map(a => a?.name).join(', ')
                                : ''
                        )}
                    </Text>
                    <Text style={styles.bookMeta}>Stock: {item.stock}</Text>
                </View>

                <TouchableOpacity
                    style={styles.btnEdit}
                    onPress={() => openEditModal(item)}
                >
                    <Text style={styles.btnTextEdit}>EDITAR</Text>
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text style={styles.title}>{safe(libraryName)}</Text>
                <TextInput
                    style={styles.search}
                    placeholder="Pesquisar livro..."
                    value={query}
                    onChangeText={setQuery}
                />

                {libraryBooksLoading && <ActivityIndicator />}
                {libraryBooksError && <Text style={styles.error}>{libraryBooksError}</Text>}

                <FlatList
                    data={filteredBooks}
                    keyExtractor={(i, idx) => String(i.id ?? idx)}
                    renderItem={renderBookItem}
                    contentContainerStyle={{ paddingBottom: 100 }}
                />

                {/* FAB */}
                <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
                    <Text style={styles.fabIcon}>＋</Text>
                </TouchableOpacity>

                {/* MODAL DESCRIÇÃO */}
                <Modal transparent visible={showDescModal} animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.descModalCard}>
                            <Text style={styles.descTitle}>
                                {safe(selectedBook?.book?.title)}
                            </Text>
                            <Text style={styles.descText}>
                                {safe(
                                    selectedBook?.book?.description ??
                                    selectedBook?.book?.summary ??
                                    'Sem descrição.'
                                )}
                            </Text>
                            <TouchableOpacity
                                style={styles.descCloseBtn}
                                onPress={() => setShowDescModal(false)}
                            >
                                <Text style={styles.descCloseText}>Fechar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* MODAL ADD */}
                <Modal transparent visible={showAddModal} animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Adicionar Livro</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="ISBN"
                                value={addIsbn}
                                onChangeText={setAddIsbn}
                            />
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Stock"
                                keyboardType="numeric"
                                value={addStock}
                                onChangeText={setAddStock}
                            />
                            <TouchableOpacity style={styles.btnOk} onPress={handleAdd}>
                                <Text style={styles.btnTextOk}>Adicionar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* MODAL EDIT */}
                <Modal transparent visible={showEditModal} animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Editar Stock</Text>
                            <TextInput
                                style={styles.modalInput}
                                keyboardType="numeric"
                                value={editStock}
                                onChangeText={setEditStock}
                            />
                            <TouchableOpacity style={styles.btnOk} onPress={handleSaveEdit}>
                                <Text style={styles.btnTextOk}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        </SafeAreaView>
    );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0b1220' },
    container: { flex: 1, padding: 16 },
    title: { color: '#fff', fontSize: 22, fontWeight: '800' },

    search: {
        backgroundColor: '#111827',
        color: '#fff',
        borderRadius: 12,
        padding: 12,
        marginVertical: 12,
        borderWidth: 1,
        borderColor: '#1f2933',
    },

    error: { color: '#f87171' },

    bookCard: {
        flexDirection: 'row',
        backgroundColor: '#111827',
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1f2933',
    },

    coverWrap: {
        width: 60,
        height: 90,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#020617',
        marginRight: 12,
    },
    cover: { width: '100%', height: '100%' },
    coverFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    coverFallbackText: { color: '#9ca3af', fontSize: 10 },

    bookInfo: { flex: 1 },
    bookTitle: { color: '#e5e7eb', fontWeight: '800' },
    bookMeta: { color: '#9ca3af', marginTop: 4 },

    btnEdit: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
    },
    btnTextEdit: { color: '#fff', fontWeight: '900', fontSize: 12 },

    fab: {
        position: 'absolute',
        right: 18,
        bottom: 18,
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#2563eb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabIcon: { color: '#fff', fontSize: 32, fontWeight: '800' },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(2,6,23,0.85)',
        justifyContent: 'center',
        padding: 18,
    },

    modalCard: {
        backgroundColor: '#0f172a',
        borderRadius: 16,
        padding: 16,
    },
    modalTitle: { color: '#fff', fontWeight: '800', marginBottom: 10 },
    modalInput: {
        backgroundColor: '#111827',
        color: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },
    btnOk: {
        backgroundColor: '#2563eb',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    btnTextOk: { color: '#fff', fontWeight: '800' },

    /* DESCRIPTION */
    descModalCard: {
        backgroundColor: '#0f172a',
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1f2933',
    },
    descTitle: { color: '#e5e7eb', fontSize: 18, fontWeight: '900' },
    descText: { color: '#e5e7eb', marginVertical: 16, lineHeight: 22 },
    descCloseBtn: {
        alignSelf: 'flex-end',
        backgroundColor: '#2563eb',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 12,
    },
    descCloseText: { color: '#fff', fontWeight: '900' },
});
