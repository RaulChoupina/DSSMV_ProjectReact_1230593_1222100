import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const safe = (s) => (s && String(s).trim() ? String(s) : 'N/A');

const toHHMM = (time) => {
    if (!time) return 'N/A';
    const str = String(time);
    const parts = str.split(':');
    if (parts.length >= 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    return str;
};

export default function LibraryCard({ library, onPress, onEdit, onDelete }) {
    const isOpen = !!library?.open;

    return (
        <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
            <View style={styles.topRow}>
                <View style={styles.headerInfo}>
                    <Text style={styles.name} numberOfLines={1}>
                        {safe(library?.name)}
                    </Text>
                    <Text style={styles.address} numberOfLines={1}>
                        {safe(library?.address)}
                    </Text>
                </View>

                <View style={[styles.badge, isOpen ? styles.badgeOpen : styles.badgeClosed]}>
                    <View style={[styles.statusDot, { backgroundColor: isOpen ? '#22c55e' : '#ef4444' }]} />
                    <Text style={[styles.badgeText, { color: isOpen ? '#166534' : '#991b1b' }]}>
                        {isOpen ? 'Aberto' : 'Fechado'}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.bottomRow}>
                <View style={styles.timeContainer}>
                    <Text style={styles.timeLabel}>HORÁRIO</Text>
                    <Text style={styles.hours}>
                        {toHHMM(library?.openTime)} – {toHHMM(library?.closeTime)}
                    </Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity onPress={onEdit} style={[styles.btn, styles.btnEdit]}>
                        <Text style={styles.btnTextEdit}>EDITAR</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onDelete} style={[styles.btn, styles.btnDelete]}>
                        <Text style={styles.btnTextDelete}>APAGAR</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16, // Um pouco mais arredondado para ser mais moderno
        padding: 20, // Aumentado para não cortar o conteúdo
        marginBottom: 16,
        marginHorizontal: 2,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerInfo: {
        flex: 1,
        marginRight: 10,
    },
    name: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    address: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 4,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        gap: 6,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    badgeOpen: { backgroundColor: '#f0fdf4' },
    badgeClosed: { backgroundColor: '#fef2f2' },
    badgeText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 16,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timeContainer: {
        flex: 1,
    },
    timeLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94a3b8',
        letterSpacing: 1.2,
        marginBottom: 4,
    },
    hours: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    btn: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnEdit: {
        backgroundColor: '#163963FF',
        borderColor: '#1e293b',
        borderWidth: 1,
    },
    btnDelete: {
        backgroundColor: '#fff1f1',
        borderColor: '#fee2e2',
        borderWidth: 1,
    },
    btnTextEdit: {
        fontSize: 11,
        fontWeight: '800',
        color: '#ffffff',
        textTransform: 'uppercase'
    },
    btnTextDelete: {
        fontSize: 11,
        fontWeight: '800',
        color: '#dc2626',
    },
});