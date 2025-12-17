// src/components/LibraryCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const safe = (s) => (s && String(s).trim() ? String(s) : 'N/A');

const toHHMM = (time) => {
    // aceita "09:00:00" ou "09:00"
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
              <Text style={styles.name} numberOfLines={1}>
                  {safe(library?.name)}
              </Text>

              <View style={[styles.badge, isOpen ? styles.badgeOpen : styles.badgeClosed]}>
                  <Text style={styles.badgeText}>{isOpen ? 'Aberto' : 'Fechado'}</Text>
              </View>
          </View>

          <Text style={styles.address} numberOfLines={2}>
              {safe(library?.address)}
          </Text>

          <View style={styles.bottomRow}>
              <Text style={styles.hours}>
                  {toHHMM(library?.openTime)} – {toHHMM(library?.closeTime)}
              </Text>

              <View style={styles.actions}>
                  <TouchableOpacity onPress={onEdit} activeOpacity={0.85} style={[styles.actionBtn, styles.editBtn]}>
                      <Text style={styles.actionText}>✏️</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={onDelete} activeOpacity={0.85} style={[styles.actionBtn, styles.deleteBtn]}>
                      <Text style={styles.actionText}>🗑️</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    name: {
        flex: 1,
        fontSize: 16,
        fontWeight: '800',
        color: '#111',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    badgeOpen: { backgroundColor: '#E7F7EC' },
    badgeClosed: { backgroundColor: '#FDEAEA' },
    badgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#111',
    },
    address: {
        marginTop: 6,
        color: '#666',
        fontSize: 13,
    },
    bottomRow: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    hours: {
        color: '#888',
        fontSize: 12,
        fontStyle: 'italic',
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    actionBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editBtn: { backgroundColor: '#EEF2FF' },
    deleteBtn: { backgroundColor: '#FEE2E2' },
    actionText: { fontSize: 18 },
});
