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

    // --- ADD MODAL ---
    const [showAddModal, setShowAddModal] = useState(false);
    const [addIsbn, setAddIsbn] = useState('');
    const [addStock, setAddStock] = useState('1');
    const [savingAdd, setSavingAdd] = useState(false);

    // --- EDIT MODAL (só abre pelo botão EDITAR) ---
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [editStock, setEditStock] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    // --- TYPEAHEAD ---
    const [taLoading, setTaLoading] = useState(false);
    const [taError, setTaError] = useState(null);
    const [taItems, setTaItems] = useState([]); // array de strings
    const [showTa, setShowTa] = useState(false);

    useEffect(() => {
        if (libraryId != null) fetchLibraryBooks(dispatch, libraryId);
    }, [dispatch, libraryId]);

    // typeahead debounce (barra de pesquisa)
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
            const request = {
                method: 'GET',
                headers: { Accept: 'application/json' },
            };

            makeHTTPRequest(
              path,
              request,
              (data) => {
                  const titles = Array.isArray(data?.titles) ? data.titles : [];
                  const authors = Array.isArray(data?.authors) ? data.authors : [];
                  const subjects = Array.isArray(data?.subjects) ? data.subjects : [];

                  const merged = [...titles, ...authors, ...subjects]
                    .filter(Boolean)
                    .map((s) => String(s).trim())
                    .filter(Boolean);

                  const unique = Array.from(new Set(merged)).slice(0, 10);
                  setTaItems(unique);
                  setShowTa(true);
                  setTaLoading(false);
              },
              (errMsg) => {
                  setTaError(errMsg);
                  setTaItems([]);
                  setShowTa(false);
                  setTaLoading(false);
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
            const title = (b?.title ?? b?.name ?? '').toLowerCase();
            const isbn = (b?.isbn ?? item?.isbn ?? '').toLowerCase();

            const authorsStr = Array.isArray(b?.authors)
              ? b.authors
                .map((a) => a?.name)
                .filter(Boolean)
                .join(', ')
                .toLowerCase()
              : '';

            return title.includes(q) || authorsStr.includes(q) || isbn.includes(q);
        });
    }, [libraryBooks, query]);

    // -------- COVER URL --------
    const extractImageId = (cover) => {
        const rel = cover?.smallUrl || cover?.mediumUrl || cover?.largeUrl;
        if (!rel) return null;
        const clean = rel.split('?')[0];
        const parts = clean.split('/');
        return parts[parts.length - 1] || null;
    };

    const buildCoverUrl = (cover) => {
        const imageId = extractImageId(cover);
        if (!imageId) return null;
        const base = BASE_URL.replace(/\/$/, '');
        return `${base}/v1/assets/cover/${imageId}`;
    };

    // ---------- API ----------
    const apiCreateBook = (isbn, payload) =>
      new Promise((resolve, reject) => {
          const path = `/v1/library/${libraryId}/book/${encodeURIComponent(isbn)}`;
          const request = {
              method: 'POST',
              headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
          };

          makeHTTPRequest(
            path,
            request,
            (data) => resolve(data),
            (errMsg) => reject(new Error(errMsg))
          );
      });

    const apiUpdateBook = (isbn, payload) =>
      new Promise((resolve, reject) => {
          const path = `/v1/library/${libraryId}/book/${encodeURIComponent(isbn)}`;
          const request = {
              method: 'PUT',
              headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
          };

          makeHTTPRequest(
            path,
            request,
            (data) => resolve(data),
            (errMsg) => reject(new Error(errMsg))
          );
      });

    // ---------- ADD ----------
    const resetAdd = () => {
        setAddIsbn('');
        setAddStock('1');
    };

    const handleAdd = async () => {
        const isbn = (addIsbn || '').trim();
        if (!isbn) return Alert.alert('Erro', 'ISBN é obrigatório.');

        const stock = Number.parseInt(addStock, 10);
        if (Number.isNaN(stock) || stock < 0) return Alert.alert('Erro', 'Stock inválido.');

        // ✅ backend-safe: available = stock (para o POST)
        const available = stock;

        setSavingAdd(true);
        try {
            await apiCreateBook(isbn, { stock, available });
            setShowAddModal(false);
            resetAdd();
            fetchLibraryBooks(dispatch, libraryId);
            Alert.alert('Sucesso', 'Livro adicionado com sucesso ✅');
        } catch (e) {
            Alert.alert('Erro', safe(e?.message || 'Falhou ao adicionar livro.'));
        } finally {
            setSavingAdd(false);
        }
    };

    // ---------- EDIT (ABRE SÓ PELO BOTÃO) ----------
    const openEditModal = (item) => {
        setSelectedItem(item);
        setEditStock(String(item?.stock ?? 0));
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedItem) return;

        const isbn = selectedItem?.book?.isbn ?? selectedItem?.isbn;
        if (!isbn) return Alert.alert('Erro', 'Não consegui detetar o ISBN deste livro.');

        const stock = Number.parseInt(editStock, 10);
        if (Number.isNaN(stock) || stock < 0) return Alert.alert('Erro', 'Stock inválido.');

        setSavingEdit(true);
        try {
            // ✅ só stock
            await apiUpdateBook(isbn, { stock });

            setShowEditModal(false);
            setSelectedItem(null);
            fetchLibraryBooks(dispatch, libraryId);
            Alert.alert('Sucesso', 'Stock atualizado ✅');
        } catch (e) {
            Alert.alert('Erro', safe(e?.message || 'Falhou ao atualizar livro.'));
        } finally {
            setSavingEdit(false);
        }
    };

    // ---------- RENDER ----------
    const renderBookItem = ({ item }) => {
        const b = item?.book;
        const coverUrl = buildCoverUrl(b?.cover);

        const title = b?.title ?? b?.name ?? 'Untitled';
        const author =
          Array.isArray(b?.authors) && b.authors.length > 0
            ? b.authors.map((a) => a?.name).filter(Boolean).join(', ')
            : 'N/A';
        const isbn = b?.isbn ?? item?.isbn;

        return (
          <View style={styles.bookCard}>
              <View style={styles.coverWrap}>
                  {coverUrl ? (
                    <Image
                      source={{ uri: coverUrl }}
                      style={styles.cover}
                      resizeMode="cover"
                      onError={(e) => console.log('IMG ERROR:', e.nativeEvent)}
                    />
                  ) : (
                    <View style={styles.coverFallback}>
                        <Text style={styles.coverFallbackText}>
                            No{'\n'}Cover
                        </Text>
                    </View>
                  )}
              </View>

              <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle} numberOfLines={2}>
                      {safe(title)}
                  </Text>

                  <Text style={styles.bookMeta} numberOfLines={2}>
                      Author: {safe(author)}
                  </Text>

                  {!!isbn && (
                    <Text style={styles.bookMeta} numberOfLines={1}>
                        ISBN: {safe(isbn)}
                    </Text>
                  )}

                  {/* ✅ Só Stock */}
                  <Text style={styles.bookMeta}>Stock: {safe(item?.stock)}</Text>
              </View>

              {/* ✅ SÓ ESTE BOTÃO ABRE O EDIT */}
              <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() => openEditModal(item)}
                    activeOpacity={0.85}
                    style={[styles.btn, styles.btnEdit]}
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
              <Text style={styles.title} numberOfLines={1}>
                  {safe(libraryName)}
              </Text>
              <Text style={styles.subtitle}>Books</Text>

              {/* ✅ SEARCH + TYPEAHEAD */}
              <View style={styles.searchWrap}>
                  <TextInput
                    style={styles.search}
                    placeholder="Search by title, author, ISBN..."
                    value={query}
                    onChangeText={(t) => {
                        setQuery(t);
                        if ((t || '').trim().length >= 3) setShowTa(true);
                    }}
                    onFocus={() => {
                        if ((query || '').trim().length >= 3 && taItems.length > 0) setShowTa(true);
                    }}
                    onBlur={() => {
                        setTimeout(() => setShowTa(false), 120);
                    }}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />

                  {taLoading && <Text style={styles.taHint}>A procurar sugestões…</Text>}
                  {!!taError && !taLoading && <Text style={styles.taError}>Typeahead: {taError}</Text>}

                  {showTa && taItems.length > 0 && (
                    <View style={styles.taDropdown}>
                        {taItems.map((sug, idx) => (
                          <TouchableOpacity
                            key={`${sug}-${idx}`}
                            style={styles.taItem}
                            activeOpacity={0.85}
                            onPress={() => {
                                setQuery(sug);
                                setShowTa(false);
                            }}
                          >
                              <Text style={styles.taText} numberOfLines={1}>
                                  {sug}
                              </Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  )}
              </View>

              {libraryBooksLoading && <ActivityIndicator size="large" />}

              {!!libraryBooksError && !libraryBooksLoading && (
                <Text style={styles.error}>Error: {libraryBooksError}</Text>
              )}

              {!libraryBooksLoading && !libraryBooksError && (
                <FlatList
                  data={filteredBooks}
                  keyExtractor={(item, idx) => String(item.id ?? item.isbn ?? idx)}
                  renderItem={renderBookItem}
                  contentContainerStyle={{ paddingBottom: 90 }}
                  ListEmptyComponent={<Text style={styles.empty}>No books found.</Text>}
                  keyboardShouldPersistTaps="handled"
                />
              )}

              {/* ✅ FAB ADD (fica flutuante) */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.fab}
                onPress={() => setShowAddModal(true)}
              >
                  <Text style={styles.fabIcon}>＋</Text>
              </TouchableOpacity>

              {/* MODAL ADD */}
              <Modal
                visible={showAddModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowAddModal(false)}
              >
                  <View style={styles.modalOverlay}>
                      <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.modalWrap}
                      >
                          <View style={styles.modalCard}>
                              <Text style={styles.modalTitle}>Add Book</Text>

                              <TextInput
                                style={styles.modalInput}
                                placeholder="ISBN (ex: 978-...)"
                                value={addIsbn}
                                onChangeText={setAddIsbn}
                                autoCapitalize="none"
                              />

                              <TextInput
                                style={styles.modalInput}
                                placeholder="Stock"
                                value={addStock}
                                onChangeText={setAddStock}
                                keyboardType="numeric"
                              />

                              <View style={styles.modalBtns}>
                                  <TouchableOpacity
                                    style={[styles.btn, styles.btnCancel2]}
                                    onPress={() => {
                                        setShowAddModal(false);
                                        resetAdd();
                                    }}
                                    disabled={savingAdd}
                                  >
                                      <Text style={styles.btnTextCancel}>Cancel</Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    style={[styles.btn, styles.btnOk]}
                                    onPress={handleAdd}
                                    disabled={savingAdd}
                                  >
                                      <Text style={styles.btnTextOk}>
                                          {savingAdd ? 'Adding...' : 'Add'}
                                      </Text>
                                  </TouchableOpacity>
                              </View>
                          </View>
                      </KeyboardAvoidingView>
                  </View>
              </Modal>

              {/* MODAL EDIT (só stock) */}
              <Modal
                visible={showEditModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowEditModal(false)}
              >
                  <View style={styles.modalOverlay}>
                      <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.modalWrap}
                      >
                          <View style={styles.modalCard}>
                              <Text style={styles.modalTitle}>Edit Stock</Text>

                              <Text style={styles.modalHint}>
                                  ISBN: {safe(selectedItem?.book?.isbn ?? selectedItem?.isbn)}
                              </Text>

                              <TextInput
                                style={styles.modalInput}
                                placeholder="Stock"
                                value={editStock}
                                onChangeText={setEditStock}
                                keyboardType="numeric"
                              />

                              <View style={styles.modalBtns}>
                                  <TouchableOpacity
                                    style={[styles.btn, styles.btnCancel2]}
                                    onPress={() => {
                                        setShowEditModal(false);
                                        setSelectedItem(null);
                                    }}
                                    disabled={savingEdit}
                                  >
                                      <Text style={styles.btnTextCancel}>Cancel</Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    style={[styles.btn, styles.btnOk]}
                                    onPress={handleSaveEdit}
                                    disabled={savingEdit}
                                  >
                                      <Text style={styles.btnTextOk}>
                                          {savingEdit ? 'Saving...' : 'Save'}
                                      </Text>
                                  </TouchableOpacity>
                              </View>
                          </View>
                      </KeyboardAvoidingView>
                  </View>
              </Modal>
          </View>
      </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0b1220' },
    container: { flex: 1, padding: 16 },

    title: { fontSize: 22, fontWeight: '800', color: '#fff' },
    subtitle: { marginTop: 4, marginBottom: 12, color: '#bbb' },

    // SEARCH + TYPEAHEAD
    searchWrap: { position: 'relative', zIndex: 50 },
    search: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
    },
    taHint: { color: '#cbd5e1', marginTop: -6, marginBottom: 8, fontSize: 12 },
    taError: { color: '#ff6b6b', marginTop: -6, marginBottom: 8, fontSize: 12 },
    taDropdown: {
        position: 'absolute',
        top: 48,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
        elevation: 12,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
    },
    taItem: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    taText: { color: '#111', fontWeight: '700' },

    error: { color: '#ff6b6b' },
    empty: { color: '#bbb', textAlign: 'center', marginTop: 20 },

    bookCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },

    coverWrap: {
        width: 62,
        height: 92,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#f2f2f2',
    },
    cover: { width: '100%', height: '100%' },

    coverFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    coverFallbackText: {
        fontSize: 11,
        color: '#999',
        fontWeight: '700',
        textAlign: 'center',
    },

    bookInfo: { flex: 1 },
    bookTitle: { fontSize: 16, fontWeight: '800', color: '#111' },
    bookMeta: { marginTop: 4, color: '#666' },

    // ✅ actions + botão EDITAR com a tua configuração
    actions: { justifyContent: 'center', alignItems: 'flex-end' },
    btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
    btnEdit: {
        backgroundColor: '#163963FF',
        borderColor: '#1e293b',
        borderWidth: 1,
    },
    btnTextEdit: { color: '#fff', fontWeight: '900', fontSize: 12 },

    // FAB
    fab: {
        position: 'absolute',
        right: 18,
        bottom: 18,
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#1976d2',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
    fabIcon: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '800',
        lineHeight: 34,
    },

    // MODALS
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        padding: 18,
    },
    modalWrap: { width: '100%' },
    modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
    modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 10 },
    modalHint: { color: '#666', marginBottom: 10 },

    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 10,
        backgroundColor: '#fff',
    },

    modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },

    btnCancel2: { backgroundColor: '#eee' },
    btnOk: { backgroundColor: '#1976d2' },
    btnTextCancel: { fontWeight: '900', color: '#111' },
    btnTextOk: { fontWeight: '900', color: '#fff' },
});
