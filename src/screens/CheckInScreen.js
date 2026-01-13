// src/screens/CheckInScreen.js
import React, { useContext, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";

import AppContext from "../context/AppContext";
import { BASE_URL } from "../service/service";
import { checkinLibraryBook } from "../context/bookActions";
import { fetchCheckedOutBooks, fetchCheckoutHistory } from "../context/userActions";

const safe = (s) => (s && String(s).trim() ? String(s) : "N/A");

const normalizeUuid = (id) => {
  const raw = String(id || "").trim();
  if (/^[0-9a-fA-F]{32}$/.test(raw)) {
    return raw.replace(
      /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
      "$1-$2-$3-$4-$5"
    );
  }
  return raw;
};

const getBookId = (item) =>
  item?.book?.isbn ??
  item?.isbn ??
  item?.bookId ??
  item?.libraryBookId ??
  item?.copyId ??
  null;

const getBookTitle = (item) =>
  item?.book?.title ??
  item?.title ??
  item?.bookTitle ??
  item?.name ??
  "Livro";

const formatAuthors = (book) => {
  if (!book) return "Autor desconhecido";
  if (Array.isArray(book.authors) && book.authors.length) {
    return book.authors
      .map((a) => (typeof a === "string" ? a : a?.name))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof book.author === "string") return book.author;
  if (book.author?.name) return book.author.name;
  return "Autor desconhecido";
};

const buildCoverUrl = (cover) => {
  const rel = cover?.smallUrl || cover?.mediumUrl || cover?.largeUrl;
  if (!rel) return null;
  const imageId = rel.split("?")[0].split("/").pop();
  return `${BASE_URL.replace(/\/$/, "")}/v1/assets/cover/${imageId}`;
};

export default function CheckInScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { state, dispatch } = useContext(AppContext);

  const { libraryId, libraryName, userId, userName, checkedOutBooks } =
  route.params || {};

  const normalizedLibraryId = useMemo(
    () => normalizeUuid(libraryId),
    [libraryId]
  );

  const [query, setQuery] = useState("");
  const [submittingId, setSubmittingId] = useState(null);

  const [localBooks, setLocalBooks] = useState(
    Array.isArray(checkedOutBooks) ? checkedOutBooks : []
  );

  const fallbackBooks = useMemo(() => {
    const maybe = state?.checkedOutBooks || state?.userCheckedOutBooks || [];
    return Array.isArray(maybe) ? maybe : [];
  }, [state]);

  const books = useMemo(() => {
    const src = localBooks.length ? localBooks : fallbackBooks;
    if (!query.trim()) return src;

    const q = query.trim().toLowerCase();
    return src.filter((b) => {
      const id = String(getBookId(b) ?? "").toLowerCase();
      const title = String(getBookTitle(b) ?? "").toLowerCase();
      const author = String(formatAuthors(b?.book)).toLowerCase();
      return id.includes(q) || title.includes(q) || author.includes(q);
    });
  }, [localBooks, fallbackBooks, query]);


  const refreshUserDataSafely = async () => {
    if (!userId) return;
    try {
      await fetchCheckedOutBooks(dispatch, userId);
      await fetchCheckoutHistory(dispatch, userId);
    } catch (e) {
      console.log("CHECKIN REFRESH ERROR:", e);
    }
  };

  const doCheckIn = async (book) => {
    const bookId = getBookId(book);

    if (!normalizedLibraryId) {
      Alert.alert("Erro", "libraryId em falta nos params.");
      return;
    }
    if (!userId) {
      Alert.alert("Erro", "Falta o userId (vem do UsersScreen).");
      return;
    }
    if (!bookId) {
      Alert.alert("Erro", "Não consegui identificar o ISBN/bookId.");
      return;
    }

    try {
      setSubmittingId(String(bookId));

      await new Promise((resolve, reject) => {
        checkinLibraryBook(
            dispatch,
            normalizedLibraryId,  // ✅ importante (já normalizado)
            bookId,
            userId,
            () => resolve(),
            (errMsg) => reject(new Error(errMsg))
        );
      });

      Alert.alert("Sucesso", `Check-in efetuado: ${safe(getBookTitle(book))}`);

      // remove da lista local imediatamente (UX rápida)
      setLocalBooks((prev) =>
          prev.filter((x) => String(getBookId(x)) !== String(bookId))
      );

      // refresh do user (para UsersScreen ficar certo ao voltar)
      await refreshUserDataSafely();
    } catch (err) {
      console.log("CHECKIN ERROR:", err);
      Alert.alert("Erro", err?.message || "Não foi possível fazer check-in.");
    } finally {
      setSubmittingId(null);
    }
  };
  const confirmCheckIn = (book) => {
    Alert.alert(
      "Confirmar check-in",
      `Devolver:\n\n${safe(getBookTitle(book))}\nISBN: ${safe(getBookId(book))}\n\nUser: ${safe(
        userName || userId
      )}`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: () => doCheckIn(book) },
      ]
    );
  };

  const headerTitle = useMemo(() => {
    const u = userName ? ` — ${userName}` : userId ? ` — ${userId}` : "";
    const l = libraryName ? ` @ ${libraryName}` : "";
    return `Check-in${u}${l}`;
  }, [userName, userId, libraryName]);

  const isBlocked = !normalizedLibraryId || !userId;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{headerTitle}</Text>
              <Text style={styles.headerSub}>
                {`Pendentes: ${books.length}  •  Library: ${safe(
                  normalizedLibraryId
                )}${userId ? `  •  User: ${safe(userId)}` : ""}`}
              </Text>
            </View>

            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backBtnText}>VOLTAR</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchBox}>
            <TextInput
              style={styles.input}
              placeholder="Pesquisar por título, autor ou ISBN..."
              placeholderTextColor="#64748b"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
            />
          </View>

          {isBlocked ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>
                { !normalizedLibraryId
                  ? "Falta libraryId nos params."
                  : "Falta userId nos params (vem do UsersScreen)."
                }
              </Text>
            </View>
          ) : (
            <FlatList
              data={books}
              keyExtractor={(item, idx) => String(getBookId(item) ?? idx)}
              contentContainerStyle={{ paddingBottom: 40 }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  Não há livros pendentes para check-in.
                </Text>
              }
              renderItem={({ item }) => {
                const isbn = getBookId(item);
                const title = getBookTitle(item);
                const author = formatAuthors(item?.book);
                const coverUrl = buildCoverUrl(item?.book?.cover);

                const busy = submittingId && String(submittingId) === String(isbn);

                return (
                  <View style={[styles.card, styles.currentCard]}>
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
                          {safe(title)}
                        </Text>
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>EM POSSE</Text>
                        </View>
                      </View>

                      <Text style={styles.author} numberOfLines={1}>
                        {safe(author)}
                      </Text>

                      <Text style={styles.meta} numberOfLines={1}>
                        ISBN: {safe(isbn)}
                      </Text>

                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          style={[styles.checkinChip, busy && styles.checkinChipDisabled]}
                          activeOpacity={0.85}
                          onPress={() => confirmCheckIn(item)}
                          disabled={!!busy}
                        >
                          {busy ? (
                            <ActivityIndicator />
                          ) : (
                            <Text style={styles.checkinChipText}>CHECK-IN</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Igual ao UsersScreen
  container: { flex: 1, backgroundColor: "#0b1220", padding: 20 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#fff" },
  headerSub: { marginTop: 4, color: "#94a3b8", fontSize: 12 },

  backBtn: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },

  searchBox: { marginBottom: 12 },
  input: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#334155",
  },

  center: { padding: 24, alignItems: "center" },
  errorText: { color: "#ef4444", fontWeight: "800", textAlign: "center" },
  emptyText: { color: "#475569", fontSize: 12, fontStyle: "italic", marginTop: 12 },

  card: {
    flexDirection: "row",
    backgroundColor: "#111827",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  currentCard: { borderLeftWidth: 4, borderLeftColor: "#3b82f6" },

  cover: { width: 70, height: 100, backgroundColor: "#1e293b" },
  coverFallback: {
    width: 70,
    height: 100,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackText: { color: "#475569", fontSize: 10, textAlign: "center" },

  info: { flex: 1, padding: 12, justifyContent: "center" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  bookTitle: { color: "#f8fafc", fontSize: 15, fontWeight: "bold", flex: 1 },
  author: { color: "#94a3b8", fontSize: 13, marginBottom: 6 },
  meta: { color: "#64748b", fontSize: 11 },

  badge: { backgroundColor: "#1d4ed8", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "bold" },

  actionsRow: { marginTop: 10, flexDirection: "row", justifyContent: "flex-end" },

  // Chip tipo "Estender"
  checkinChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
  },
  checkinChipDisabled: { opacity: 0.6 },
  checkinChipText: { color: "#93c5fd", fontSize: 12, fontWeight: "900" },
});
