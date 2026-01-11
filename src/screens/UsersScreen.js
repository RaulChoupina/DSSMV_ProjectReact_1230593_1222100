// src/screens/UsersScreen.js
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
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppContext from '../context/AppContext';
import {
    fetchCheckedOutBooks,
    fetchCheckoutHistory,
    extendCheckout,
} from '../context/userActions';
import { BASE_URL } from '../service/service';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import RNShake from 'react-native-shake';
import { useCallback, useRef } from 'react';

export default function UsersScreen() {
    const { state, dispatch } = useContext(AppContext);

    // Estados globais vindo do AppProvider
    const {
        checkedOutBooks = [],
        checkoutHistory = [],
        checkedOutLoading,
        historyLoading,
        checkedOutError,
        historyError,
        extendLoading,
        extendError,
        extendingCheckoutId,
    } = state;

    const navigation = useNavigation();

    const lastShakeRef = useRef(0);
    const COOLDOWN_MS = 1200;

    const [searchId, setSearchId] = useState('');
    const [lastUserId, setLastUserId] = useState(null); // ✅ último ID pesquisado (para o shake)

    const isLoading = checkedOutLoading || historyLoading;

    // Função para buscar dados nos dois endpoints específicos
    const handleSearch = () => {
        const id = (searchId || '').trim();
        if (!id) {
            return Alert.alert('Aviso', 'Insira um ID de utilizador');
        }
        setLastUserId(id); //  guarda o ID válido para o shake
        fetchCheckedOutBooks(dispatch, id);
        fetchCheckoutHistory(dispatch, id);
    };

    const handleExtend = async (checkoutId) => {
        const userId = (lastUserId || (searchId || '').trim() || '').trim();
        if (!userId) {
            Alert.alert('Aviso', 'Pesquisa primeiro um utilizador.');
            return;
        }

        try {
            const res = await extendCheckout(dispatch, checkoutId);

            // tentar ir buscar a nova data (se o backend devolver)
            const newDueDate =
              res?.dueDate ||
              res?.expectedReturnDate ||
              res?.returnDate ||
              null;

            Alert.alert(
              'Sucesso',
              newDueDate
                ? `A data de entrega foi estendida para ${newDueDate.split('T')[0]}.`
                : 'A data de entrega foi estendida com sucesso.'
            );

            // refresh institucional
            fetchCheckedOutBooks(dispatch, userId);
            fetchCheckoutHistory(dispatch, userId);

        } catch (e) {
            const msg = String(e || '');

            if (msg.toLowerCase().includes('maximum of 6 weeks')) {
                Alert.alert(
                  'Não é possível estender',
                  'Este livro já atingiu o limite máximo de 6 semanas requisitado.'
                );
            } else {
                Alert.alert('Erro', msg || 'Não foi possível estender o checkout.');
            }
        }
    };

    // ✅ SHAKE: abre CheckInScreen usando o último userId pesquisado
    useFocusEffect(
      useCallback(() => {
          const sub = RNShake.addListener(() => {
              const now = Date.now();
              if (now - lastShakeRef.current < COOLDOWN_MS) return;
              lastShakeRef.current = now;

              const userId = (lastUserId || (searchId || '').trim() || '').trim();

              if (!userId) {
                  Alert.alert('Shake', 'Escreve o ID do utilizador e carrega em BUSCAR primeiro.');
                  return;
              }

              // 🔐 só permite abrir se houver livros em posse
              if (!checkedOutBooks || checkedOutBooks.length === 0) {
                  Alert.alert('Check-in', 'Este utilizador não tem livros pendentes para devolução.');
                  return;
              }

              // ⚠️ assume que todos os empréstimos pendentes são da mesma biblioteca
              // Se o teu objeto não tiver libraryId/libraryName, diz-me o formato e eu ajusto já.
              navigation.navigate('CheckIn', {
                  libraryId: checkedOutBooks[0]?.libraryId,
                  libraryName: checkedOutBooks[0]?.libraryName || 'Biblioteca',
                  userId,
                  userName: userId, // se não tiveres nome no payload, o ID serve
                  checkedOutBooks,
              });
          });

          return () => sub.remove();
      }, [navigation, lastUserId, searchId, checkedOutBooks])
    );

    useFocusEffect(
      useCallback(() => {
          const userId = (lastUserId || (searchId || "").trim() || "").trim();
          if (!userId) return;

          let alive = true;

          (async () => {
              try {
                  // se estas actions devolverem Promise, isto apanha erros
                  await fetchCheckedOutBooks(dispatch, userId);
                  await fetchCheckoutHistory(dispatch, userId);
              } catch (e) {
                  console.log("REFRESH AFTER CHECKIN ERROR:", e);
                  // não mostres alert aqui para não chatear a UX
              }
          })();

          return () => {
              alive = false;
          };
      }, [dispatch, lastUserId, searchId]) // mantém como tinhas
    );


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
          ? book.authors.map((a) => a.name).join(', ')
          : 'Autor desconhecido';

        const isExtendingThis =
          !!extendLoading && String(extendingCheckoutId) === String(item?.id);

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
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>EM POSSE</Text>
                        </View>
                      )}
                  </View>

                  <Text style={styles.author} numberOfLines={1}>
                      {authorName}
                  </Text>

                  <View style={styles.details}>
                      <Text style={styles.dateText}> Requisitado: {item.checkoutDate || 'N/A'}</Text>

                      <View style={styles.dueRow}>
                          <Text style={[styles.dateText, isCurrent && styles.dueDate]} numberOfLines={1}>
                              Entrega: {item.dueDate?.split('T')[0] || 'N/A'}
                              {isCurrent && item._extendedLocal ? ' (data estendida)' : ''}
                          </Text>

                          {isCurrent && item?.id ? (
                            <TouchableOpacity
                              style={[styles.extendChip, isExtendingThis ? styles.extendChipDisabled : null]}
                              activeOpacity={0.85}
                              onPress={() => handleExtend(item.id)}
                              disabled={isExtendingThis}
                            >
                                <Text style={styles.extendChipText}>
                                    {isExtendingThis ? 'A estender...' : 'Estender'}
                                </Text>
                            </TouchableOpacity>
                          ) : null}
                      </View>
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
                keyboardType="default"
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                  <Text style={styles.searchBtnText}>BUSCAR</Text>
              </TouchableOpacity>
          </View>

          {(checkedOutError || historyError) && (
            <Text style={styles.errorText}>Erro ao carregar dados. Verifique o ID.</Text>
          )}

          {extendError ? <Text style={styles.errorText}>{String(extendError)}</Text> : null}

          {isLoading ? (
            <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={[
                  { title: ' LIVROS ATUAIS', data: checkedOutBooks, current: true },
                  { title: ' HISTÓRICO DE DEVOLUÇÕES', data: checkoutHistory, current: false },
              ]}
              keyExtractor={(item) => item.title}
              renderItem={({ item }) => (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {item.title} ({item.data?.length || 0})
                    </Text>
                    {!item.data || item.data.length === 0 ? (
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
    input: {
        flex: 1,
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 15,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#334155',
    },
    searchBtn: { backgroundColor: '#2563eb', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 12 },
    searchBtnText: { color: '#fff', fontWeight: 'bold' },
    section: { marginBottom: 25 },
    sectionTitle: { color: '#3b82f6', fontSize: 13, fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 },
    card: {
        flexDirection: 'row',
        backgroundColor: '#111827',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#1f2937',
    },
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
    errorText: { color: '#ef4444', textAlign: 'center', marginBottom: 10 },

    // ✅ chip "Estender" alinhado com a data (não fica perdido na UI)
    dueRow: {
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    extendChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#334155',
        backgroundColor: '#0f172a',
    },
    extendChipDisabled: {
        opacity: 0.6,
    },
    extendChipText: {
        color: '#93c5fd',
        fontSize: 11,
        fontWeight: '700',
    },
});
