// src/screens/Top5Screen.js
import React, { useContext, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import AppContext from '../context/AppContext';
import { fetchCheckedOutBooks } from '../context/userActions';

export default function Top5Screen({ route }) {
  const { state, dispatch } = useContext(AppContext);

  const userId = route?.params?.userId; // vem do shake (ou do ecrã anterior)

  const { checkedOutBooks, checkedOutBooksLoading, checkedOutBooksError } = state;

  useEffect(() => {
    if (userId) fetchCheckedOutBooks(dispatch, userId);
  }, [dispatch, userId]);

  const top5 = useMemo(() => {
    if (!Array.isArray(checkedOutBooks)) return [];

    // cada item aqui representa 1 empréstimo ativo -> pode repetir ISBN
    const getIsbn = (x) => x?.isbn ?? x?.book?.isbn ?? x?.bookId ?? null;
    const getTitle = (x) => x?.title ?? x?.book?.title ?? 'N/A';

    const map = new Map();

    for (const item of checkedOutBooks) {
      const isbn = getIsbn(item);
      if (!isbn) continue;

      const prev = map.get(isbn);
      if (!prev) {
        map.set(isbn, { isbn, title: getTitle(item), count: 1 });
      } else {
        prev.count += 1;
        map.set(isbn, prev);
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [checkedOutBooks]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top 5 (empréstimos ativos)</Text>

      {!userId ? (
        <Text style={styles.warn}>Falta userId para ir buscar os checked-out.</Text>
      ) : null}

      {checkedOutBooksLoading ? <Text>A carregar...</Text> : null}
      {checkedOutBooksError ? <Text style={styles.err}>Erro: {String(checkedOutBooksError)}</Text> : null}

      <FlatList
        data={top5}
        keyExtractor={(item) => item.isbn}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.rank}>{index + 1}.</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.book}>{item.title}</Text>
              <Text style={styles.meta}>ISBN: {item.isbn} • {item.count} ativo(s)</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !checkedOutBooksLoading ? <Text style={styles.warn}>Sem dados para Top 5.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' },
  rank: { width: 28, fontWeight: '700' },
  book: { fontSize: 15, fontWeight: '600' },
  meta: { marginTop: 2, color: '#666' },
  warn: { color: '#666', marginTop: 10 },
  err: { color: 'red', marginTop: 10 },
});
