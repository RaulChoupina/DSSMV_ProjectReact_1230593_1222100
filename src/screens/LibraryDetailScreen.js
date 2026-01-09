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
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';

import AppContext from '../context/AppContext';
import { fetchLibraryBooks, updateLibraryBook } from '../context/bookActions'; // ✅ usa a action já existente
import { BASE_URL, makeHTTPRequest } from '../service/service';

const safe = (s) => (s && String(s).trim() ? String(s) : 'N/A');

// ✅ Autor robusto: suporta string | object | array (de strings/objetos)
const pickAuthorName = (x) => {
    if (!x) return null;
    if (typeof x === 'string') return x;
    if (typeof x === 'object') return x.name || x.fullName || x.authorName || x.value || null;
    return null;
};

const formatAuthors = (book) => {
    if (!book) return 'Autor desconhecido';

    const a = book.author;
    if (Array.isArray(a)) {
        const names = a.map(pickAuthorName).filter(Boolean);
        if (names.length) return names.join(', ');
    } else {
        const name = pickAuthorName(a);
        if (name) return name;
    }

    const arr = book.authors;
    if (Array.isArray(arr)) {
        const names = arr.map(pickAuthorName).filter(Boolean);
        if (names.length) return names.join(', ');
    }

    const alt = pickAuthorName(book.bookAuthor);
    if (alt) return alt;

    return 'Autor desconhecido';
};

export default function LibraryDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
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
    const [showDescriptionModal, setShowDescriptionModal] = useState(false);

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
            setTaError(null);
            return;
        }

        const t = setTimeout(() => {
            setTaLoading(true);
            setTaError(null);

            const path = `/v1/search/typeahead?query=${encodeURIComponent(q)}`;
            makeHTTPRequest(
              path,
              { method: 'GET' },
              (data) => {
                  const results = [
                      ...(data?.titles || []),
                      ...(data?.authors || []),
                      ...(data?.subjects || []),
                  ];
                  const uniq = [...new Set(results.map((x) => String(x)))].slice(0, 10);
                  setTaItems(uniq);
                  setShowTa(true);
                  setTaLoading(false);
              },
              (err) => {
                  setTaError(err || 'Erro no typeahead');
                  setTaLoading(false);
                  setTaItems([]);
                  setShowTa(false);
              }
            );
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

            // ✅ autor em string para poder pesquisar sem dar [object Object]
            const authorStr = (formatAuthors(b) || '').toLowerCase();

            const subjects = Array.isArray(b?.subjects) ? b.subjects.join(' ').toLowerCase() : '';

            return title.includes(q) || isbn.includes(q) || authorStr.includes(q) || subjects.includes(q);
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
          makeHTTPRequest(
            path,
            {
                method,
                headers: payload ? { 'Content-Type': 'application/json' } : {},
                body: payload ? JSON.stringify(payload) : undefined,
            },
            resolve,
            (err) => reject(new Error(err))
          );
      });

    // --- HANDLERS ---

    const handleAddBookConfirm = async () => {
        if (!addIsbn.trim()) return Alert.alert('Erro', 'ISBN é obrigatório.');
        setSavingAdd(true);
        try {
            await apiJson(
              `/v1/library/${libraryId}/book/${encodeURIComponent(addIsbn.trim())}`,
              'POST',
              { stock: parseInt(addStock) || 0 }
            );
            setShowAddModal(false);
            setAddIsbn('');
            setAddStock('1');
            fetchLibraryBooks(dispatch, libraryId);
            Alert.alert('Sucesso', 'Livro adicionado ao inventário.');
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível adicionar o livro. Verifique o ISBN.');
        } finally {
            setSavingAdd(false);
        }
    };

    // ✅ EDITAR STOCK (usa a action Flux já existente: PUT /v1/library/{libraryId}/book/{isbn})
    const handleEditBookConfirm = () => {
        if (!selectedItem) return Alert.alert('Erro', 'Nenhum livro selecionado.');

        const isbn = getBookId(selectedItem);
        if (!isbn) return Alert.alert('Erro', 'ISBN inválido.');

        const stockVal = parseInt((editStock || '').trim(), 10);
        if (Number.isNaN(stockVal) || stockVal < 0) {
            return Alert.alert('Erro', 'Stock inválido.');
        }

        setSavingEdit(true);

        updateLibraryBook(
          dispatch,
          libraryId,
          isbn,
          { stock: stockVal },
          () => {
              setSavingEdit(false);
              setShowEditModal(false);
              Alert.alert('Sucesso', 'Stock atualizado.');
          },
          (errMsg) => {
              setSavingEdit(false);
              Alert.alert('Erro', errMsg || 'Não foi possível atualizar o stock.');
          }
        );
    };

    const handleCheckoutConfirm = async () => {
        if (!checkoutUsername.trim()) return Alert.alert('Erro', 'UserId é obrigatório.');
        setSavingCheckout(true);
        try {
            await apiJson(
              `/v1/library/${libraryId}/book/${encodeURIComponent(
                getBookId(selectedItem)
              )}/checkout?userId=${encodeURIComponent(checkoutUsername)}`,
              'POST'
            );
            setShowCheckoutModal(false);
            fetchLibraryBooks(dispatch, libraryId);
            Alert.alert('Sucesso', 'Check-out efetuado ');
        } catch (e) {
            Alert.alert('Erro', e.message);
        } finally {
            setSavingCheckout(false);
        }
    };

    const handleCheckinConfirm = async () => {
        if (!checkinUsername.trim()) return Alert.alert('Erro', 'UserId é obrigatório.');
        setSavingCheckin(true);
        try {
            await apiJson(
              `/v1/library/${libraryId}/book/${encodeURIComponent(
                getBookId(selectedItem)
              )}/checkin?userId=${encodeURIComponent(checkinUsername)}`,
              'POST'
            );
            setShowCheckinModal(false);
            fetchLibraryBooks(dispatch, libraryId);
            Alert.alert('Sucesso', 'Check-in efetuado ');
        } catch (e) {
            Alert.alert('Erro', e.message);
        } finally {
            setSavingCheckin(false);
        }
    };

    const renderBookItem = ({ item }) => {
        const b = item?.book;
        const coverUrl = buildCoverUrl(b?.cover);
        const title = b?.title ?? 'Sem Título';
        const isbn = getIsbnFromItem(item);

        // ✅ autor formatado (nunca [object Object])
        const author = formatAuthors(b);

        return (
          <View style={styles.bookCard}>
              <TouchableOpacity
                style={styles.bookClickArea}
                onPress={() => {
                    setSelectedItem(item);
                    setShowDescriptionModal(true);
                }}
              >
                  <View style={styles.coverWrap}>
                      {coverUrl ? (
                        <Image source={{ uri: coverUrl }} style={styles.cover} />
                      ) : (
                        <View style={styles.coverFallback}>
                            <Text style={styles.coverFallbackText}>No Cover</Text>
                        </View>
                      )}
                  </View>

                  <View style={styles.bookInfo}>
                      <Text style={styles.bookTitle} numberOfLines={2}>
                          {safe(title)}
                      </Text>
                      <Text style={styles.bookMeta} numberOfLines={1}>
                          Autor: {safe(author)}
                      </Text>
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

                  {/* ✅ EDITAR (AGORA ABRE O MODAL) */}
                  <TouchableOpacity
                    style={styles.btnMiniEdit}
                    onPress={() => {
                        setSelectedItem(item);
                        setEditStock(String(item?.stock ?? '0'));
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
          <TouchableWithoutFeedback
            onPress={() => {
                Keyboard.dismiss();
                closeAllOverlays();
            }}
          >
              <View style={styles.container}>
                  <View style={styles.headerRow}>
                      <View style={{ flex: 1 }}>
                          <Text style={styles.title}>{safe(libraryName)}</Text>
                          <Text style={styles.subtitle}>Gestão de Inventário</Text>
                      </View>
                      <TouchableOpacity style={styles.btnAddMain} onPress={() => setShowAddModal(true)}>
                          <Text style={styles.btnAddMainText}>+ ADICIONAR</Text>
                      </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.search}
                    placeholder="Pesquisar..."
                    value={query}
                    onChangeText={(t) => {
                        setQuery(t);
                        if ((t || '').trim().length < 3) setShowTa(false);
                    }}
                    onFocus={() => {
                        if ((query || '').trim().length >= 3 && taItems.length > 0) setShowTa(true);
                    }}
                  />

                  {/* ✅ TYPEAHEAD UI */}
                  {(taLoading || showTa) && (
                    <View style={styles.taWrap}>
                        {taLoading && <Text style={styles.taHint}>A procurar...</Text>}

                        {!taLoading && taError && (
                          <Text style={styles.taHint}>Erro: {String(taError)}</Text>
                        )}

                        {!taLoading && !taError && taItems.length === 0 && (
                          <Text style={styles.taHint}>Sem sugestões</Text>
                        )}

                        {!taLoading && !taError && taItems.length > 0 && (
                          <ScrollView keyboardShouldPersistTaps="handled">
                              {taItems.map((sug, idx) => (
                                <TouchableOpacity
                                  key={`${sug}-${idx}`}
                                  style={styles.taItem}
                                  onPress={() => {
                                      setQuery(String(sug));
                                      setShowTa(false);
                                      Keyboard.dismiss();
                                  }}
                                >
                                    <Text style={styles.taItemText}>{String(sug)}</Text>
                                </TouchableOpacity>
                              ))}
                          </ScrollView>
                        )}
                    </View>
                  )}

                  {libraryBooksLoading ? (
                    <ActivityIndicator size="large" color="#fff" />
                  ) : (
                    <FlatList
                      data={filteredBooks}
                      keyExtractor={(item, idx) => String(item?.isbn || item?.book?.isbn || idx)}
                      renderItem={renderBookItem}
                      contentContainerStyle={{ paddingBottom: 100 }}
                      keyboardShouldPersistTaps="handled"
                      onScrollBeginDrag={() => setShowTa(false)}
                    />
                  )}

                  {/* MODAL ADICIONAR LIVRO */}
                  <Modal visible={showAddModal} transparent animationType="slide">
                      <View style={styles.modalOverlay}>
                          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                              <View style={styles.modalCard}>
                                  <Text style={styles.modalTitle}>Novo Livro no Stock</Text>
                                  <Text style={styles.bookMeta}>Introduza o ISBN e a quantidade inicial.</Text>

                                  <View style={{ marginTop: 15 }}>
                                      <TextInput
                                        style={styles.modalInput}
                                        placeholder="ISBN do Livro"
                                        value={addIsbn}
                                        onChangeText={setAddIsbn}
                                        keyboardType="numeric"
                                      />
                                      <TextInput
                                        style={styles.modalInput}
                                        placeholder="Stock Inicial"
                                        value={addStock}
                                        onChangeText={setAddStock}
                                        keyboardType="numeric"
                                      />
                                  </View>

                                  <View style={styles.modalBtns}>
                                      <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                          <Text>Cancelar</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        onPress={handleAddBookConfirm}
                                        style={[styles.btnOk, { backgroundColor: '#163963' }]}
                                        disabled={savingAdd}
                                      >
                                          {savingAdd ? (
                                            <ActivityIndicator color="#fff" />
                                          ) : (
                                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>ADICIONAR</Text>
                                          )}
                                      </TouchableOpacity>
                                  </View>
                              </View>
                          </KeyboardAvoidingView>
                      </View>
                  </Modal>

                  {/* ✅ MODAL EDITAR LIVRO (STOCK) */}
                  <Modal visible={showEditModal} transparent animationType="slide">
                      <View style={styles.modalOverlay}>
                          <View style={styles.modalCard}>
                              <Text style={styles.modalTitle}>Editar Stock</Text>
                              <Text style={styles.bookMeta}>{selectedItem?.book?.title || 'Livro selecionado'}</Text>
                              <Text style={styles.bookMeta}>ISBN: {getIsbnFromItem(selectedItem)}</Text>

                              <TextInput
                                style={styles.modalInput}
                                placeholder="Novo stock"
                                value={editStock}
                                onChangeText={setEditStock}
                                keyboardType="numeric"
                              />

                              <View style={styles.modalBtns}>
                                  <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                      <Text>Cancelar</Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    onPress={handleEditBookConfirm}
                                    style={[styles.btnOk, { backgroundColor: '#163963' }]}
                                    disabled={savingEdit}
                                  >
                                      {savingEdit ? (
                                        <ActivityIndicator color="#fff" />
                                      ) : (
                                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>GUARDAR</Text>
                                      )}
                                  </TouchableOpacity>
                              </View>
                          </View>
                      </View>
                  </Modal>

                  {/* MODAL DE DESCRIÇÃO COMPLETA */}
                  <Modal visible={showDescriptionModal} animationType="slide" transparent>
                      <View style={styles.modalOverlay}>
                          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
                              <ScrollView>
                                  <View style={styles.descHeader}>
                                      {buildCoverUrl(selectedItem?.book?.cover) ? (
                                        <Image
                                          source={{ uri: buildCoverUrl(selectedItem?.book?.cover) }}
                                          style={styles.descCover}
                                          resizeMode="contain"
                                        />
                                      ) : (
                                        <View
                                          style={[
                                              styles.descCover,
                                              { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
                                          ]}
                                        >
                                            <Text style={{ color: '#666' }}>No Cover</Text>
                                        </View>
                                      )}

                                      <View style={{ flex: 1, marginLeft: 15 }}>
                                          <Text style={styles.modalTitle}>{selectedItem?.book?.title}</Text>
                                          <Text style={styles.bookMeta}>Autor: {safe(formatAuthors(selectedItem?.book))}</Text>
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

                  {/* MENU DE AÇÕES */}
                  <Modal visible={showActionsMenu} transparent animationType="fade">
                      <TouchableOpacity style={styles.menuOverlay} onPress={() => setShowActionsMenu(false)}>
                          <View style={styles.menuCard}>
                              <Text style={styles.menuTitle}>{selectedItem?.book?.title || 'Opções'}</Text>
                              <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setShowActionsMenu(false);
                                    setShowCheckoutModal(true);
                                }}
                              >
                                  <Text style={styles.menuItemText}> CHECK-OUT</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setShowActionsMenu(false);
                                    setShowCheckinModal(true);
                                }}
                              >
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
                              <TextInput
                                style={styles.modalInput}
                                placeholder="ID do Utilizador"
                                value={checkoutUsername}
                                onChangeText={setCheckoutUsername}
                              />
                              <View style={styles.modalBtns}>
                                  <TouchableOpacity onPress={() => setShowCheckoutModal(false)}>
                                      <Text>Cancelar</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity onPress={handleCheckoutConfirm} style={styles.btnOk}>
                                      {savingCheckout ? (
                                        <ActivityIndicator color="#fff" />
                                      ) : (
                                        <Text style={{ color: '#fff' }}>Confirmar</Text>
                                      )}
                                  </TouchableOpacity>
                              </View>
                          </View>
                      </View>
                  </Modal>

                  {/* MODAL CHECK-IN */}
                  <Modal visible={showCheckinModal} transparent animationType="slide">
                      <View style={styles.modalOverlay}>
                          <View style={styles.modalCard}>
                              <Text style={styles.modalTitle}>Check-in</Text>
                              <TextInput
                                style={styles.modalInput}
                                placeholder="ID do Utilizador"
                                value={checkinUsername}
                                onChangeText={setCheckinUsername}
                              />
                              <View style={styles.modalBtns}>
                                  <TouchableOpacity onPress={() => setShowCheckinModal(false)}>
                                      <Text>Cancelar</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity onPress={handleCheckinConfirm} style={styles.btnOk}>
                                      {savingCheckin ? (
                                        <ActivityIndicator color="#fff" />
                                      ) : (
                                        <Text style={{ color: '#fff' }}>Confirmar</Text>
                                      )}
                                  </TouchableOpacity>
                              </View>
                          </View>
                      </View>
                  </Modal>
              </View>
          </TouchableWithoutFeedback>
      </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#0b1220',
    },
    container: {
        flex: 1,
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        marginBottom: 15,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
    },
    subtitle: {
        color: '#bbb',
    },
    btnAddMain: {
        backgroundColor: '#1976d2',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    btnAddMainText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    search: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },

    // ✅ TYPEAHEAD styles
    taWrap: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e6e6e6',
        maxHeight: 220,
    },
    taHint: {
        padding: 12,
        color: '#666',
    },
    taItem: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    taItemText: {
        color: '#111',
        fontWeight: '600',
    },

    bookCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    bookClickArea: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center',
    },
    coverWrap: {
        width: 60,
        height: 85,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#eee',
    },
    cover: {
        width: '100%',
        height: '100%',
    },
    coverFallback: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#eee',
    },
    coverFallbackText: {
        color: '#666',
        fontSize: 10,
    },
    bookInfo: {
        flex: 1,
        marginLeft: 12,
    },
    bookTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#111',
    },
    bookMeta: {
        color: '#666',
        fontSize: 13,
        marginTop: 2,
    },
    itemActionsColumn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 10,
    },
    itemMenuBtn: {
        padding: 8,
    },
    itemMenuBtnText: {
        fontSize: 26,
        color: '#163963',
        fontWeight: 'bold',
    },
    btnMiniEdit: {
        backgroundColor: '#163963',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    btnTextEdit: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    descHeader: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    descCover: {
        width: 100,
        height: 150,
        borderRadius: 10,
    },
    descLabel: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#111',
        marginTop: 10,
    },
    descText: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
        marginTop: 5,
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuCard: {
        width: 250,
        backgroundColor: '#fff',
        borderRadius: 15,
        overflow: 'hidden',
    },
    menuTitle: {
        padding: 15,
        fontWeight: 'bold',
        textAlign: 'center',
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    menuItem: {
        padding: 15,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    menuItemText: {
        fontWeight: 'bold',
        color: '#111',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 10,
        marginBottom: 15,
    },
    modalBtns: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    btnOk: {
        backgroundColor: '#1976d2',
        padding: 10,
        borderRadius: 8,
    },
    btnTextOk: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
