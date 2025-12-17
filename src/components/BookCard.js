import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { BASE_URL } from '../service/service';

const extractImageId = (cover) => {
    const rel = cover?.smallUrl || cover?.mediumUrl || cover?.largeUrl;
    if (!rel) return null;

    const clean = rel.split('?')[0];
    const parts = clean.split('/');
    return parts[parts.length - 1] || null;
};

const buildCoverFromSwagger = (cover) => {
    const imageId = extractImageId(cover);
    if (!imageId) return null;

    const base = BASE_URL.replace(/\/$/, '');
    return `${base}/v1/assets/cover/${imageId}`;
};

const BookCard = ({ book, onPress }) => {
    const authorName =
      Array.isArray(book?.authors) && book.authors.length > 0
        ? book.authors.map((a) => a?.name).filter(Boolean).join(', ')
        : 'Autor desconhecido';

    const coverUrl = buildCoverFromSwagger(book?.cover);

    return (
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.85}>
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={styles.cover}
              resizeMode="cover"
              onError={(e) => console.log('IMG ERROR:', e.nativeEvent, coverUrl)}
            />
          ) : (
            <View style={styles.coverFallback}>
                <Text style={styles.coverFallbackText}>No{'\n'}Cover</Text>
            </View>
          )}

          <View style={styles.info}>
              <Text style={styles.title} numberOfLines={2}>
                  {book?.title || 'Untitled'}
              </Text>
              <Text style={styles.author} numberOfLines={2}>
                  {authorName}
              </Text>
          </View>
      </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        marginHorizontal: 16,
        elevation: 2,
    },
    cover: { width: 80, height: 120, backgroundColor: '#eee' },
    coverFallback: {
        width: 80,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eee',
    },
    coverFallbackText: {
        fontSize: 11,
        color: '#999',
        fontWeight: '700',
        textAlign: 'center',
    },
    info: { flex: 1, padding: 12, justifyContent: 'center' },
    title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4, color: '#333' },
    author: { fontSize: 14, color: '#666' },
});

export default BookCard;
