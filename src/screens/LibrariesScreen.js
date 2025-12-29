// src/screens/LibrariesScreen.js
import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

import AppContext from '../context/AppContext';
import {
  fetchLibraries,
  addLibrary,
  editLibrary,
  removeLibrary,
} from '../context/libraryActions';

import LibraryCard from '../components/LibraryCard';

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const LibrariesScreen = () => {
  const navigation = useNavigation();
  const { state, dispatch } = useContext(AppContext);
  const { libraries, librariesLoading, librariesError } = state;

  const [searchQuery, setSearchQuery] = useState('');

  // ADD
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newOpenTime, setNewOpenTime] = useState('09:00');
  const [newCloseTime, setNewCloseTime] = useState('18:00');
  const [newDays, setNewDays] = useState([]);
  const [showAddOpenPicker, setShowAddOpenPicker] = useState(false);
  const [showAddClosePicker, setShowAddClosePicker] = useState(false);

  // EDIT
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editOpenTime, setEditOpenTime] = useState('09:00');
  const [editCloseTime, setEditCloseTime] = useState('18:00');
  const [editDays, setEditDays] = useState([]);
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  const [showEditOpenPicker, setShowEditOpenPicker] = useState(false);
  const [showEditClosePicker, setShowEditClosePicker] = useState(false);

  useEffect(() => {
    fetchLibraries(dispatch);
  }, [dispatch]);

  const filteredLibraries = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();

    // filtra
    const base = !q
      ? (libraries || [])
      : (libraries || []).filter((lib) => {
        const name = (lib.name || '').toLowerCase();
        return name.includes(q);
      });

    // ordena: open=true primeiro, open=false no fim
    // (se open vier undefined/null, tratamos como fechado)
    return [...base].sort((a, b) => {
      const ao = a?.open ? 1 : 0;
      const bo = b?.open ? 1 : 0;
      return bo - ao; // desc => 1 primeiro
    });
  }, [libraries, searchQuery]);

  const safe = (s) => {
    if (!s || String(s).trim() === '') return 'N/A';
    return String(s);
  };

  const handlePressLibrary = (lib) => {
    navigation.navigate('LibraryDetail', {
      libraryId: lib.id,
      libraryName: lib.name,
    });
  };

  const toggleDayInList = (currentList, day) => {
    if (currentList.includes(day)) {
      return currentList.filter((d) => d !== day);
    }
    return [...currentList, day];
  };

  const toBackendTime = (hhmm, fallback) => {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm || '');
    if (!match) return fallback;
    return `${match[1]}:${match[2]}:00`;
  };

  const buildOpenDaysString = (daysArray) =>
    daysArray && daysArray.length > 0 ? daysArray.join(',') : '';

  const confirmDelete = (lib) => {
    Alert.alert(
      'Apagar biblioteca',
      `Queres mesmo apagar "${safe(lib.name)}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeLibrary(dispatch, lib.id);
              Alert.alert("Sucesso", "A biblioteca foi eliminada com sucesso", [
                { text: "OK", onPress: () => navigation.goBack() }
              ]);
            } catch (e) {
              Alert.alert('Erro', 'Falhou ao apagar a biblioteca.');
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const openEditFromCard = (lib) => {
    setSelectedLibrary(lib);

    setEditName(lib.name || '');
    setEditAddress(lib.address || '');

    const oTime = (lib.openTime || '09:00:00').split(':');
    const cTime = (lib.closeTime || '18:00:00').split(':');
    setEditOpenTime(`${oTime[0] || '09'}:${oTime[1] || '00'}`);
    setEditCloseTime(`${cTime[0] || '18'}:${cTime[1] || '00'}`);

    if (lib.openDays) {
      setEditDays(
        lib.openDays
          .split(',')
          .map((d) => d.trim())
          .filter((d) => d.length > 0),
      );
    } else {
      setEditDays([]);
    }

    setShowEditModal(true);
  };

  const handleAddLibrary = async () => {
    if (!newName.trim()) {
      Alert.alert('Erro', 'Name is required');
      return;
    }
    if (!newAddress.trim()) {
      Alert.alert('Erro', 'Address is required');
      return;
    }

    const body = {
      name: newName.trim(),
      address: newAddress.trim(),
      openDays: buildOpenDaysString(newDays),
      openTime: toBackendTime(newOpenTime, '09:00:00'),
      closeTime: toBackendTime(newCloseTime, '18:00:00'),
    };

    try {
      await addLibrary(dispatch, body);
      setNewName('');
      setNewAddress('');
      setNewOpenTime('09:00');
      setNewCloseTime('18:00');
      setNewDays([]);
      setShowAddModal(false);
    } catch (e) {
      Alert.alert('Erro', 'Falhou ao adicionar biblioteca.');
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedLibrary) return;

    if (!editName.trim()) {
      Alert.alert('Erro', 'Name is required');
      return;
    }
    if (!editAddress.trim()) {
      Alert.alert('Erro', 'Address is required');
      return;
    }

    const body = {
      name: editName.trim(),
      address: editAddress.trim(),
      openDays: buildOpenDaysString(editDays),
      openTime: toBackendTime(
        editOpenTime,
        selectedLibrary.openTime || '09:00:00',
      ),
      closeTime: toBackendTime(
        editCloseTime,
        selectedLibrary.closeTime || '18:00:00',
      ),
    };

    try {
      await editLibrary(dispatch, selectedLibrary.id, body);
      setShowEditModal(false);
      setSelectedLibrary(null);
    } catch (e) {
      Alert.alert('Erro', 'Falhou ao atualizar biblioteca.');
    }
  };

  const renderDaySelector = (currentDays, setDays) => (
    <View style={styles.daysRow}>
      {DAYS.map((day) => {
        const selected = currentDays.includes(day);
        return (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayChip,
              selected && styles.dayChipSelected,
            ]}
            onPress={() => setDays(toggleDayInList(currentDays, day))}
          >
            <Text
              style={[
                styles.dayChipText,
                selected && styles.dayChipTextSelected,
              ]}
            >
              {day[0]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const parseHHMMToDate = (hhmm, defaultHour = 9, defaultMinute = 0) => {
    const d = new Date();
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm || '');
    const h = match ? parseInt(match[1], 10) : defaultHour;
    const m = match ? parseInt(match[2], 10) : defaultMinute;
    d.setHours(h, m, 0, 0);
    return d;
  };

  const formatDateToHHMM = (date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const renderLibraryItem = ({ item: lib }) => (
    <LibraryCard
      library={lib}
      onPress={() => handlePressLibrary(lib)}
      onEdit={() => openEditFromCard(lib)}
      onDelete={() => confirmDelete(lib)}
    />
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Libraries</Text>

        {/* Barra de pesquisa */}
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar biblioteca..."
          placeholderTextColor='#FFFFFF'
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {librariesLoading && <ActivityIndicator size="large" />}

        {librariesError && !librariesLoading && (
          <Text style={styles.error}>Erro: {librariesError}</Text>
        )}

        {!librariesLoading && !librariesError && (
          <FlatList
            data={filteredLibraries}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderLibraryItem}
            contentContainerStyle={styles.listContent}
          />
        )}

        {/* Botão Add Library */}
        <View style={styles.bottomBar}>
          {/* Floating Action Button (Add) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setShowAddModal(true)}
            style={styles.fab}
          >
            <Text style={styles.fabIcon}>＋</Text>
          </TouchableOpacity>

        </View>

        {/* Modal ADD */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Add New Library</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Name"
                placeholderTextColor='#FFFFFF'
                value={newName}
                onChangeText={setNewName}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Address"
                placeholderTextColor='#FFFFFF'
                value={newAddress}
                onChangeText={setNewAddress}
              />

              <View style={styles.timeRow}>
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>Open</Text>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowAddOpenPicker(true)}
                  >
                    <Text style={styles.timeButtonText}>
                      {newOpenTime || '09:00'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>Close</Text>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowAddClosePicker(true)}
                  >
                    <Text style={styles.timeButtonText}>
                      {newCloseTime || '18:00'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.timeLabel}>Open Days</Text>
              {renderDaySelector(newDays, setNewDays)}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowAddModal(false);
                    setNewName('');
                    setNewAddress('');
                    setNewOpenTime('09:00');
                    setNewCloseTime('18:00');
                    setNewDays([]);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={handleAddLibrary}
                >
                  <Text style={styles.modalButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Picker de hora para ADD (Open) */}
        {showAddOpenPicker && (
          <DateTimePicker
            value={parseHHMMToDate(newOpenTime, 9, 0)}
            mode="time"
            is24Hour
            display="clock"
            onChange={(event, date) => {
              setShowAddOpenPicker(false);
              if (date) setNewOpenTime(formatDateToHHMM(date));
            }}
          />
        )}

        {/* Picker de hora para ADD (Close) */}
        {showAddClosePicker && (
          <DateTimePicker
            value={parseHHMMToDate(newCloseTime, 18, 0)}
            mode="time"
            is24Hour
            display="clock"
            onChange={(event, date) => {
              setShowAddClosePicker(false);
              if (date) setNewCloseTime(formatDateToHHMM(date));
            }}
          />
        )}

        {/* Modal EDIT */}
        <Modal
          visible={showEditModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Edit Library</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Name"
                placeholderTextColor='#FFFFFF'
                value={editName}
                onChangeText={setEditName}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Address"
                placeholderTextColor='#FFFFFF'
                value={editAddress}
                onChangeText={setEditAddress}
              />

              <View style={styles.timeRow}>
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>Open</Text>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowEditOpenPicker(true)}
                  >
                    <Text style={styles.timeButtonText}>
                      {editOpenTime || '09:00'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>Close</Text>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowEditClosePicker(true)}
                  >
                    <Text style={styles.timeButtonText}>
                      {editCloseTime || '18:00'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.timeLabel}>Open Days</Text>
              {renderDaySelector(editDays, setEditDays)}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowEditModal(false);
                    setSelectedLibrary(null);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Picker de hora para EDIT (Open) */}
        {showEditOpenPicker && (
          <DateTimePicker
            value={parseHHMMToDate(editOpenTime, 9, 0)}
            mode="time"
            is24Hour
            display="clock"
            onChange={(event, date) => {
              setShowEditOpenPicker(false);
              if (date) setEditOpenTime(formatDateToHHMM(date));
            }}
          />
        )}

        {/* Picker de hora para EDIT (Close) */}
        {showEditClosePicker && (
          <DateTimePicker
            value={parseHHMMToDate(editCloseTime, 18, 0)}
            mode="time"
            is24Hour
            display="clock"
            onChange={(event, date) => {
              setShowEditClosePicker(false);
              if (date) setEditCloseTime(formatDateToHHMM(date));
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  // ==========================================
  // 1. ESTRUTURA GLOBAL E BASE
  // ==========================================
  safe: {
    flex: 1,
    backgroundColor: '#0b1220', // Fundo principal Dark
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 12,
  },

  // ==========================================
  // 2. CAMPO DE BUSCA (SEARCH)
  // ==========================================
  searchInput: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: '#e5e7eb',
    borderWidth: 1,
    borderColor: '#1f2933',
  },

  // ==========================================
  // 3. LISTAGEM E ESTADOS (FLATLIST / ERRORS)
  // ==========================================
  listContent: {
    paddingBottom: 120, // Espaço extra para não cobrir itens com o FAB/Barra
  },
  error: {
    color: '#f87171',
    marginTop: 8,
  },

  // ==========================================
  // 4. NAVEGAÇÃO E BOTÃO FLUTUANTE (FAB)
  // ==========================================
  bottomBar: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1f2933',
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999, // Garante que fica por cima de tudo
    elevation: 12, // Sombra para Android
    shadowColor: '#000', // Início sombras para iOS
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  fabIcon: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 34,
  },

  // ==========================================
  // 5. MODAL - ESTRUTURA BASE
  // ==========================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.85)', // Overlay escuro semitransparente
    justifyContent: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1f2933',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#e5e7eb',
  },
  modalInput: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2933',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    color: '#e5e7eb',
  },

  // ==========================================
  // 6. MODAL - SELEÇÃO DE TEMPO (TIME)
  // ==========================================
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeCol: {
    flex: 1,
    marginRight: 8,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#9ca3af',
  },
  timeButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2933',
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#111827',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#e5e7eb',
  },

  // ==========================================
  // 7. MODAL - SELEÇÃO DE DIAS (CHIPS)
  // ==========================================
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  dayChip: {
    borderWidth: 1,
    borderColor: '#1f2933',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: '#0b1220',
  },
  dayChipSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  dayChipText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  dayChipTextSelected: {
    color: '#fff',
  },

  // ==========================================
  // 8. MODAL - BOTÕES DE AÇÃO
  // ==========================================
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 8,
  },
  modalButtonCancel: {
    backgroundColor: '#374151',
  },
  modalButtonConfirm: {
    backgroundColor: '#2563eb',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default LibrariesScreen;
