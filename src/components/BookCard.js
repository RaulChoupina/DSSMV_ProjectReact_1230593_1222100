import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

const BookCard = ({ book, onPress }) => {
    // A API retorna authors como array de objetos
    const authorName = book.authors && book.authors.length > 0
        ? book.authors[0].name
        : 'Autor desconhecido';

    // Fallback se não houver capa
    const imageUri = book.cover?.mediumUrl || 'https://via.placeholder.com/100x150';

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <Image
                source={{ uri: imageUri }}
                style={styles.cover}
                resizeMode="cover"
            />
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
                <Text style={styles.author}>{authorName}</Text>

                {/* Se quiser mostrar o ano de publicação */}
                {book.publishDate && (
                    <Text style={styles.year}>{book.publishDate.split('-')[0]}</Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 12,
        marginHorizontal: 16,
        elevation: 2,
    },
    cover: {
        width: 80,
        height: 120,
    },
    info: {
        flex: 1,
        padding: 12,
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333',
    },
    author: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    year: {
        fontSize: 12,
        color: '#999',
    },
});

export default BookCard;