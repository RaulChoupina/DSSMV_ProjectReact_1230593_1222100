import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import AppContext from '../context/AppContext';
import { fetchUserHistory, extendCheckout } from '../context/userActions';

export default function UserDetailScreen() {
    const route = useRoute();
    const { userId, userName } = route.params || {};

    const { state, dispatch } = useContext(AppContext);

    // ✅ Estes nomes devem coincidir exatamente com o seu initialState no AppProvider.js
    const { userHistory, userHistoryLoading, userHistoryError } = state;

    const [showExtendModal, setShowExtendModal] = useState(false);
    const [selectedCheckout, setSelectedCheckout] = useState(null);

    // ✅ Chamada automática à API ao abrir o ecrã
    useEffect(() => {
        if (userId) {
            fetchUserHistory(dispatch, userId);
        }
    }, [userId, dispatch]);

    const handleOpenExtendModal = (item) => {
        setSelectedCheckout(item);
        setShowExtendModal(true);
    };

    const handleConfirmExtend = async () => {
        if (!selectedCheckout) return;

        extendCheckout(dispatch, selectedCheckout.id, (success, error) => {
            if (success) {
                Alert.alert("Sucesso", `Prazo de "${selectedCheckout.bookTitle || 'Livro'}" estendido! ✅`);
                setShowExtendModal(false);
                fetchUserHistory(dispatch, userId); // Recarrega a lista
            } else {
                Alert.alert("Erro", "Falha ao estender o prazo.");
            }
        });
    };

    const renderHistoryItem = ({ item }) => {
        // Lógica de atraso
        const isOverdue = new Date(item.dueDate) < new Date() && !item.returned;

        return (
            <View style={[styles.historyCard, isOverdue && styles.cardOverdue]}>
                <View style={styles.historyInfo}>
                    {/* Fallback de nomes de campos da API */}
                    <Text style={styles.historyTitle}>
                        {item.bookTitle || item.book?.title || item.title || 'Livro Desconhecido'}
                    </Text>
                    <Text style={styles.dateInfo}>Requisitado: {item.checkoutDate}</Text>
                    <Text style={[styles.dateInfo, isOverdue && styles.textOverdue]}>
                        Entrega: {item.dueDate} {isOverdue ? '⚠️ (ATRASADO)' : ''}
                    </Text>
                </View>

                {!item.returned && (
                    <TouchableOpacity
                        style={styles.btnExtend}
                        onPress={() => handleOpenExtendModal(item)}
                    >
                        <Text style={styles.btnExtendText}>EXTENDER</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.sectionTitle}>Perfil: {userName || 'Utilizador'}</Text>
                <Text style={styles.idText}>ID: {userId}</Text>
            </View>

            <Text style={styles.listLabel}>Histórico de Requisições</Text>

            {userHistoryLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : userHistoryError ? (
                <View style={styles.center}>
                    <Text style={styles.errorText}>Erro: {userHistoryError}</Text>
                </View>
            ) : (
                <FlatList
                    data={userHistory || []}
                    keyExtractor={(item, index) => item.id ? String(item.id) : String(index)}
                    renderItem={renderHistoryItem}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Nenhum livro requisitado encontrado.</Text>
                    }
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}

            <Modal visible={showExtendModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Confirmar Extensão</Text>
                        <Text style={styles.modalInfoText}>Deseja extender o prazo para:</Text>
                        <Text style={styles.modalBookTitle}>
                            {selectedCheckout?.bookTitle || selectedCheckout?.book?.title}
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.btnCancel} onPress={() => setShowExtendModal(false)}>
                                <Text style={styles.btnTextCancel}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnConfirm} onPress={handleConfirmExtend}>
                                <Text style={styles.btnTextConfirm}>Confirmar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0b1220', padding: 16 },
    headerContainer: { marginBottom: 20 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    idText: { color: '#9ca3af', fontSize: 12 },
    listLabel: { fontSize: 16, fontWeight: '700', color: '#3b82f6', marginBottom: 15 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#f87171', textAlign: 'center' },
    emptyText: { color: '#9ca3af', textAlign: 'center', marginTop: 40 },
    historyCard: {
        backgroundColor: '#111827',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    cardOverdue: { borderColor: '#ef4444', backgroundColor: '#1a1010' },
    historyInfo: { flex: 1 },
    historyTitle: { fontSize: 16, fontWeight: '700', color: '#f3f4f6', marginBottom: 4 },
    dateInfo: { fontSize: 13, color: '#9ca3af' },
    textOverdue: { color: '#f87171', fontWeight: '700' },
    btnExtend: { backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    btnExtendText: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.9)', justifyContent: 'center', padding: 24 },
    modalContainer: { backgroundColor: '#0f172a', borderRadius: 18, padding: 22, borderWidth: 1, borderColor: '#1f2937' },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 10 },
    modalInfoText: { color: '#9ca3af', fontSize: 14 },
    modalBookTitle: { fontSize: 16, color: '#3b82f6', fontWeight: '700', marginBottom: 25 },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    btnCancel: { padding: 12 },
    btnTextCancel: { color: '#9ca3af', fontWeight: '600' },
    btnConfirm: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
    btnTextConfirm: { color: '#fff', fontWeight: '800' },
});