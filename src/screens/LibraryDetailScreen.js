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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';

import AppContext from '../context/AppContext';
import { fetchLibraryBooks } from '../context/libraryActions';
import { BASE_URL } from '../service/service';

const safe = (s) => (s && String(s).trim() ? String(s) : 'N/A');

const toHHMM = (time) => {
    if (!time) return 'N/A';
    const str = String(time);
    const parts = str.split(':');
    if (parts.length >= 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    return str;
};

export default function LibraryDetailScreen() {
    const route = useRoute();
    const { libraryId, libraryName } = route.params || {};

    const { state, dispatch } = useContext(AppContext);
    const { libraryBooks, libraryBooksLoading, libraryBooksError } = state;

    const [query, setQuery] = useState('');

    useEffect(() => {
        if (libraryId != null) {
            fetchLibraryBooks(dispatch, libraryId);
        }
    }, [dispatch, libraryId]);

    const filteredBooks = useMemo(() => {
        const q = (query || '').trim().toLowerCase();
        if (!q) return libraryBooks || [];

        return (libraryBooks || []).filter((item) => {
            const b = item?.book ?? item;

            const title = (b?.title ?? b?.name ?? '').toLowerCase();
            const isbn = (b?.isbn ?? item?.isbn ?? '').toLowerCase();

            const authorsStr =
              Array.isArray(b?.authors)
                ? b.authors.map((a) => a?.name).filter(Boolean).join(', ').toLowerCase()
                : '';

            return title.includes(q) || authorsStr.includes(q) || isbn.includes(q);
        });
    }, [libraryBooks, query]);

    const extractImageId = (cover) => {
        const rel = cover?.smallUrl || cover?.mediumUrl || cover?.largeUrl;
        if (!rel) return null;

        // tira query strings se existirem
        const clean = rel.split('?')[0];

        // apanha só o último segmento (filename)
        const parts = clean.split('/');
        return parts[parts.length - 1] || null; // ex: "978-...-S.jpg"
    };


    const buildCoverUrl = (cover) => {
        const imageId = extractImageId(cover);
        if (!imageId) return null;

        const base = BASE_URL.replace(/\/$/, '');
        return `${base}/v1/assets/cover/${imageId}`;
    };



    const renderBookItem = ({ item }) => {
        const b = item?.book;
        const coverUrl = buildCoverUrl(b?.cover);
        console.log('COVER URL:', coverUrl);
        const title = b?.title ?? b?.name ?? 'Untitled';

        const author =
          Array.isArray(b?.authors) && b.authors.length > 0
            ? b.authors.map((a) => a?.name).filter(Boolean).join(', ')
            : 'N/A';

        const isbn = b?.isbn ?? item?.isbn;



        return (
          <TouchableOpacity activeOpacity={0.9} style={styles.bookCard}>
              {/* COVER */}
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
                        <Text style={styles.coverFallbackText}>No{'\n'}Cover</Text>
                    </View>
                  )}
              </View>

              {/* INFO */}
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
              </View>
          </TouchableOpacity>
        );
    };



    return (
      <SafeAreaView style={styles.safe}>
          <View style={styles.container}>
              <Text style={styles.title} numberOfLines={1}>{safe(libraryName)}</Text>
              <Text style={styles.subtitle}>Books</Text>

              <TextInput
                style={styles.search}
                placeholder="Search by title, author, ISBN..."
                value={query}
                onChangeText={setQuery}
              />

              {libraryBooksLoading && <ActivityIndicator size="large" />}

              {!!libraryBooksError && !libraryBooksLoading && (
                <Text style={styles.error}>Error: {libraryBooksError}</Text>
              )}

              {!libraryBooksLoading && !libraryBooksError && (
                <FlatList
                  data={filteredBooks}
                  keyExtractor={(item, idx) => String(item.id ?? item.isbn ?? idx)}
                  renderItem={renderBookItem}
                  contentContainerStyle={{ paddingBottom: 16 }}
                  ListEmptyComponent={
                      <Text style={styles.empty}>No books found for this library.</Text>
                  }
                />
              )}
          </View>
      </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#121212' },
    container: { flex: 1, padding: 16 },

    title: { fontSize: 22, fontWeight: '800', color: '#fff' },
    subtitle: { marginTop: 4, marginBottom: 12, color: '#bbb' },

    search: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
    },

    error: { color: '#ff6b6b' },
    empty: { color: '#bbb', textAlign: 'center', marginTop: 20 },

    bookCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        flexDirection: 'row',
        gap: 12,
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

    cover: {
        width: '100%',
        height: '100%',
    },

    coverFallback: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    coverFallbackText: {
        fontSize: 11,
        color: '#999',
        fontWeight: '700',
        textAlign: 'center',
    },

    bookInfo: {
        flex: 1,
        justifyContent: 'center',
    },

    bookTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    bookTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#111' },
    bookMeta: { marginTop: 4, color: '#666' },

    badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    badgeOk: { backgroundColor: '#E7F7EC' },
    badgeBad: { backgroundColor: '#FDEAEA' },
    badgeText: { fontSize: 11, fontWeight: '800', color: '#111' },
});
