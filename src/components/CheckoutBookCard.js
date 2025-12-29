// src/components/CheckoutBookCard.js
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { BASE_URL } from '../service/service';

const CheckoutBookCard = ({ item, isCurrent, onPress }) => {
    // A estrutura da API costuma vir com o objeto 'book' dentro do checkout
    const book = item.book || {};

    const authorName =
        Array.isArray(book?.authors) && book.authors.length > 0
            ? book.authors.map((a) => a?.name).filter(Boolean).join(', ')
            : 'Autor desconhecido';

    // Reaproveita a tua lógica de capas
    const extractImageId = (cover) => {
        const rel = cover?.smallUrl || cover?.mediumUrl || cover?.largeUrl;
        if (!rel) return null;
        const clean = rel.split('?')[0];
        const parts = clean.split('/');
        return parts[parts.length - 1] || null;
    };

    const imageId = extractImageId(book?.cover);
    const coverUrl = imageId ? `${BASE_URL.replace(/\/$/, '')}/v1/assets/cover/${imageId}` : null;

    return (
        <TouchableOpacity
            style={[styles.container, isCurrent ? styles.currentBorder : styles.pastOpacity]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            {coverUrl ? (
                <Image source={{ uri: coverUrl }} style={styles.cover} resizeMode="cover" />
            ) : (
                <View style={styles.coverFallback}>
                    <Text style={styles.coverFallbackText}>No{'\n'}Cover</Text>
                </View>
            )}

            <View style={styles.info}>
                <View style={styles.headerRow}>
                    <Text style={styles.title} numberOfLines={1}>
                        {book?.title || item.bookTitle || 'Untitled'}
                    </Text>
                    {isCurrent && (
                        <View style={styles.badge}><Text style={styles.badgeText}>EM POSSE</Text></View>
                    )}
                </View>

                <Text style={styles.author} numberOfLines={1}>{authorName}</Text>

                <View style={styles.detailsBox}>
                    <Text style={styles.dateText}>📅 Requisitado: {item.checkoutDate || 'N/A'}</Text>
                    <Text style={[styles.dateText, isCurrent && styles.dueDateHighlight]}>
                        ⌛ Entrega: {item.dueDate?.split('T')[0] || 'N/A'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#1e293b', // Fundo escuro para combinar com o teu painel
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    currentBorder: { borderLeftWidth: 5, borderLeftColor: '#3b82f6' },
    pastOpacity: { opacity: 0.8 },
    cover: { width: 70, height: 100, backgroundColor: '#0f172a' },
    coverFallback: { width: 70, height: 100, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
    coverFallbackText: { fontSize: 10, color: '#475569', textAlign: 'center' },
    info: { flex: 1, padding: 10, justifyContent: 'center' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 15, fontWeight: 'bold', color: '#f8fafc', flex: 1, marginRight: 5 },
    author: { fontSize: 13, color: '#94a3b8', marginBottom: 6 },
    badge: { backgroundColor: '#2563eb', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
    detailsBox: { borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 4 },
    dateText: { fontSize: 11, color: '#64748b' },
    dueDateHighlight: { color: '#fbbf24', fontWeight: '700' },
});

export default CheckoutBookCard;