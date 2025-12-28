// src/screens/LibraryDetailScreen.js
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
    ScrollView,
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

    // --- MODALS ---
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [showCheckinModal, setShowCheckinModal] = useState(false);
    const [showDescriptionModal, setShowDescriptionModal] = useState(false); // NOVO MODAL

    // --- ESTADOS DE DADOS ---
    const [selectedItem, setSelectedItem] = useState(null);
    const [addIsbn, setAddIsbn] = useState('');
    const [addStock, setAddStock] = useState('1');
    const [editStock, setEditStock] = useState('');
    const [checkoutUsername, setCheckoutUsername] = useState('');
    const [checkinUsername, setCheckinUsername] = useState('');

    // --- LOADING STATES ---
    const [savingAdd, setSavingAdd] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);
    const [savingCheckout, setSavingCheckout] = useState(false);
    const [savingCheckin, setSavingCheckin] = useState(false);

    // --- TYPEAHEAD ---
    const [taLoading, setTaLoading] = useState(false);
    const [taError, setTaError] = useState(null);
    const [taItems, setTaItems] = useState([]);
    const [showTa, setShowTa] = useState(false);

    useEffect(() => {
        if (libraryId != null) fetchLibraryBooks(dispatch, libraryId);
    }, [dispatch, libraryId]);

    const getIsbnFromItem = (item) => item?.book?.isbn ?? item?.isbn ?? null;
    const getBookId = (item) => getIsbnFromItem(item);

    const closeAllOverlays = () => {
        setShowActionsMenu(false);
        setShowTa(false);
    };

    // Typeahead Logic
    useEffect(() => {
        const q = (query || '').trim();
        if (q.length < 3) {
            setTaItems([]);
            setShowTa(false);
            setTaLoading(false);
            return;
        }

        const t = setTimeout(() => {
            setTaLoading(true);
            const path = `/v1/search/typeahead?query=${encodeURIComponent(q)}`;
            makeHTTPRequest(path, { method: 'GET' }, (data) => {
                const results = [...(data?.titles || []), ...(data?.authors || [])];
                setTaItems([...new Set(results)].slice(0, 10));
                setShowTa(true);
                setTaLoading(false);
            }, () => setTaLoading(false));
        }, 350);
        return () => clearTimeout(t);
    }, [query]);

    const filteredBooks = useMemo(() => {
        const q = (query || '').trim().toLowerCase();
        if (!q) return libraryBooks || [];
        return (libraryBooks || []).filter((item) => {
            const b = item?.book ?? item;
            const title = (b?.title ?? '').toLowerCase();
            const isbn = (b?.isbn ?? '').toLowerCase();
            return title.includes(q) || isbn.includes(q);
        });
    }, [libraryBooks, query]);

    const buildCoverUrl = (cover) => {
        const rel = cover?.smallUrl || cover?.mediumUrl || cover?.largeUrl;
        if (!rel) return null;
        const imageId = rel.split('/').pop().split('?')[0];
        return `${BASE_URL.replace(/\/$/, '')}/v1/assets/cover/${imageId}`;
    };

    const apiJson = (path, method, payload) =>
        new Promise((resolve, reject) => {
            makeHTTPRequest(path, {
                method,
                headers: payload ? { 'Content-Type': 'application/json' } : {},
                body: payload ? JSON.stringify(payload) : undefined
            }, resolve, (err) => reject(new Error(err)));
        });

    const handleCheckoutConfirm = async () => {
        if (!checkoutUsername.trim()) return Alert.alert('Erro', 'UserId é obrigatório.');
        setSavingCheckout(true);
        try {
            await apiJson(`/v1/library/${libraryId}/book/${encodeURIComponent(getBookId(selectedItem))}/checkout?userId=${encodeURIComponent(checkoutUsername)}`, 'POST');
            setShowCheckoutModal(false);
            fetchLibraryBooks(dispatch, libraryId);
            Alert.alert('Sucesso', 'Check-out efetuado ');
        } catch (e) { Alert.alert('Erro', e.message); }
        finally { setSavingCheckout(false); }
    };

    const handleCheckinConfirm = async () => {
        if (!checkinUsername.trim()) return Alert.alert('Erro', 'UserId é obrigatório.');
        setSavingCheckin(true);
        try {
            await apiJson(`/v1/library/${libraryId}/book/${encodeURIComponent(getBookId(selectedItem))}/checkin?userId=${encodeURIComponent(checkinUsername)}`, 'POST');
            setShowCheckinModal(false);
            fetchLibraryBooks(dispatch, libraryId);
            Alert.alert('Sucesso', 'Check-in efetuado ');
        } catch (e) { Alert.alert('Erro', e.message); }
        finally { setSavingCheckin(false); }
    };

    const renderBookItem = ({ item }) => {
        const b = item?.book;
        const coverUrl = buildCoverUrl(b?.cover);
        const title = b?.title ?? 'Sem Título';
        const isbn = getIsbnFromItem(item);

        return (
            <View style={styles.bookCard}>
                {/* O CLIQUE AQUI ABRE A DESCRIÇÃO */}
                <TouchableOpacity
                    style={styles.bookClickArea}
                    onPress={() => {
                        setSelectedItem(item);
                        setShowDescriptionModal(true);
                    }}
                >
                    <View style={styles.coverWrap}>
                        {coverUrl ? <Image source={{ uri: coverUrl }} style={styles.cover} /> :
                            <View style={styles.coverFallback}><Text style={styles.coverFallbackText}>No Cover</Text></View>}
                    </View>

                    <View style={styles.bookInfo}>
                        <Text style={styles.bookTitle} numberOfLines={2}>{safe(title)}</Text>
                        <Text style={styles.bookMeta}>Stock: {safe(item?.stock)}</Text>
                        <Text style={styles.bookMeta}>ISBN: {safe(isbn)}</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.itemActionsColumn}>
                    <TouchableOpacity
                        style={styles.itemMenuBtn}
                        onPress={() => {
                            setSelectedItem(item);
                            setShowActionsMenu(true);
                        }}
                    >
                        <Text style={styles.itemMenuBtnText}>⋮</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.btnMiniEdit}
                        onPress={() => {
                            setSelectedItem(item);
                            setEditStock(String(item.stock));
                            setShowEditModal(true);
                        }}
                    >
                        <Text style={styles.btnTextEdit}>EDITAR</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>{safe(libraryName)}</Text>
                        <Text style={styles.subtitle}>Gestão de Inventário</Text>
                    </View>
                </View>

                <TextInput
                    style={styles.search}
                    placeholder="Pesquisar..."
                    value={query}
                    onChangeText={setQuery}
                />

                {libraryBooksLoading ? <ActivityIndicator size="large" color="#fff" /> : (
                    <FlatList
                        data={filteredBooks}
                        keyExtractor={(item, idx) => String(item.isbn || idx)}
                        renderItem={renderBookItem}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />
                )}

                {/* MODAL DE DESCRIÇÃO COMPLETA */}
                <Modal visible={showDescriptionModal} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalCard, { maxHeight: '80%' }]}>
                            <ScrollView>
                                <View style={styles.descHeader}>
                                    <Image
                                        source={{ uri: buildCoverUrl(selectedItem?.book?.cover) }}
                                        style={styles.descCover}
                                        resizeMode="contain"
                                    />
                                    <View style={{flex: 1, marginLeft: 15}}>
                                        <Text style={styles.modalTitle}>{selectedItem?.book?.title}</Text>
                                        <Text style={styles.bookMeta}>ISBN: {getIsbnFromItem(selectedItem)}</Text>
                                    </View>
                                </View>

                                <Text style={styles.descLabel}>Descrição:</Text>
                                <Text style={styles.descText}>
                                    {selectedItem?.book?.description || 'Nenhuma descrição disponível para este livro.'}
                                </Text>
                            </ScrollView>

                            <TouchableOpacity
                                style={[styles.btnOk, { marginTop: 20 }]}
                                onPress={() => setShowDescriptionModal(false)}
                            >
                                <Text style={styles.btnTextOk}>Fechar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* MENU DE AÇÕES (ABRE PARA O LIVRO CLICADO) */}
                <Modal visible={showActionsMenu} transparent animationType="fade">
                    <TouchableOpacity style={styles.menuOverlay} onPress={() => setShowActionsMenu(false)}>
                        <View style={styles.menuCard}>
                            <Text style={styles.menuTitle}>{selectedItem?.book?.title || 'Opções'}</Text>
                            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowActionsMenu(false); setShowCheckoutModal(true); }}>
                                <Text style={styles.menuItemText}> CHECK-OUT</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowActionsMenu(false); setShowCheckinModal(true); }}>
                                <Text style={styles.menuItemText}> CHECK-IN</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* MODAL CHECK-OUT */}
                <Modal visible={showCheckoutModal} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Check-out</Text>
                            <TextInput style={styles.modalInput} placeholder="ID do Utilizador" value={checkoutUsername} onChangeText={setCheckoutUsername} />
                            <View style={styles.modalBtns}>
                                <TouchableOpacity onPress={() => setShowCheckoutModal(false)}><Text>Cancelar</Text></TouchableOpacity>
                                <TouchableOpacity onPress={handleCheckoutConfirm} style={styles.btnOk}><Text style={{color:'#fff'}}>Confirmar</Text></TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* MODAL CHECK-IN */}
                <Modal visible={showCheckinModal} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Check-in</Text>
                            <TextInput style={styles.modalInput} placeholder="ID do Utilizador" value={checkinUsername} onChangeText={setCheckinUsername} />
                            <View style={styles.modalBtns}>
                                <TouchableOpacity onPress={() => setShowCheckinModal(false)}><Text>Cancelar</Text></TouchableOpacity>
                                <TouchableOpacity onPress={handleCheckinConfirm} style={styles.btnOk}><Text style={{color:'#fff'}}>Confirmar</Text></TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // ==========================================
    // 1. ESTRUTURA GLOBAL E TELAS
    // ==========================================
    safe: {
        flex: 1,
        backgroundColor: '#0b1220' // Fundo azul escuro profundo (Dark Theme)
    },
    container: {
        flex: 1,
        padding: 16 // Margem interna padrão para não encostar nos bordos do ecrã
    },
    headerRow: {
        flexDirection: 'row',
        marginBottom: 15 // Alinha título e subtítulo horizontalmente
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff' // Título principal em branco para contraste
    },
    subtitle: {
        color: '#bbb' // Subtítulo em cinza claro para hierarquia visual
    },
    search: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 15 // Caixa de pesquisa arredondada
    },

    // ==========================================
    // 2. CARTÃO DO LIVRO (LISTA PRINCIPAL)
    // ==========================================
    bookCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        flexDirection: 'row', // Organiza Capa, Info e Ações lado a lado
        alignItems: 'center',
    },
    bookClickArea: {
        flexDirection: 'row',
        flex: 1, // Ocupa todo o espaço restante para facilitar o toque na descrição
        alignItems: 'center',
    },
    coverWrap: {
        width: 60,
        height: 85,
        borderRadius: 8,
        overflow: 'hidden', // Garante que a imagem respeite o arredondamento
        backgroundColor: '#eee'
    },
    cover: {
        width: '100%',
        height: '100%'
    },
    bookInfo: {
        flex: 1,
        marginLeft: 12 // Espaçamento entre a capa e o texto informativo
    },
    bookTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#111'
    },
    bookMeta: {
        color: '#666',
        fontSize: 13,
        marginTop: 2 // Texto secundário (ISBN/Stock) mais pequeno e suave
    },

    // ==========================================
    // 3. AÇÕES RÁPIDAS NO ITEM (DIREITA)
    // ==========================================
    itemActionsColumn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 10 // Coluna isolada para os botões ⋮ e EDITAR
    },
    itemMenuBtn: {
        padding: 8 // Área de toque aumentada para o menu de três pontos
    },
    itemMenuBtnText: {
        fontSize: 26,
        color: '#163963',
        fontWeight: 'bold'
    },
    btnMiniEdit: {
        backgroundColor: '#163963',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8 // Botão pequeno para não poluir o card
    },
    btnTextEdit: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold'
    },

    // ==========================================
    // 4. MODAL DE DESCRIÇÃO (DETALHES)
    // ==========================================
    descHeader: {
        flexDirection: 'row',
        marginBottom: 20 // Capa e Título lado a lado no topo do modal
    },
    descCover: {
        width: 100,
        height: 150,
        borderRadius: 10 // Capa maior para visualização detalhada
    },
    descLabel: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#111',
        marginTop: 10
    },
    descText: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20, // Espaçamento entre linhas para facilitar a leitura
        marginTop: 5
    },

    // ==========================================
    // 5. MENU DROPDOWN (CHECK-IN/OUT)
    // ==========================================
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)', // Escurece o fundo ao abrir opções
        justifyContent: 'center',
        alignItems: 'center'
    },
    menuCard: {
        width: 250,
        backgroundColor: '#fff',
        borderRadius: 15,
        overflow: 'hidden'
    },
    menuTitle: {
        padding: 15,
        fontWeight: 'bold',
        textAlign: 'center',
        borderBottomWidth: 1,
        borderColor: '#eee'
    },
    menuItem: {
        padding: 15,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#eee'
    },
    menuItemText: {
        fontWeight: 'bold',
        color: '#111'
    },

    // ==========================================
    // 6. MODAIS DE INPUT (FORMULÁRIOS)
    // ==========================================
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)', // Fundo mais escuro para foco total no formulário
        justifyContent: 'center',
        padding: 20
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 10,
        marginBottom: 15 // Estilo padrão para campos de texto
    },
    modalBtns: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    btnOk: {
        backgroundColor: '#1976d2',
        padding: 10,
        borderRadius: 8 // Botão de ação principal em azul vibrante
    },
    btnTextOk: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center'
    },
});