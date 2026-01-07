// src/context/reducer.js
import {
  FETCH_LIBRARIES_REQUEST,
  FETCH_LIBRARIES_SUCCESS,
  FETCH_LIBRARIES_FAILURE,

  FETCH_LIBRARY_BOOKS_REQUEST,
  FETCH_LIBRARY_BOOKS_SUCCESS,
  FETCH_LIBRARY_BOOKS_FAILURE,
  ADD_LIBRARY_BOOK_REQUEST,
  ADD_LIBRARY_BOOK_SUCCESS,
  ADD_LIBRARY_BOOK_FAILURE,
  UPDATE_LIBRARY_BOOK_REQUEST,
  UPDATE_LIBRARY_BOOK_SUCCESS,
  UPDATE_LIBRARY_BOOK_FAILURE,
} from './ActionTypes';

const reducer = (state, action) => {
  switch (action.type) {
    case FETCH_LIBRARIES_REQUEST:
      return { ...state, librariesLoading: true, librariesError: null };

    case FETCH_LIBRARIES_SUCCESS:
      // Ajustado para aceitar tanto objeto com chave .libraries quanto payload direto
      return {
        ...state,
        librariesLoading: false,
        libraries: action.payload.libraries || action.payload,
      };

    case FETCH_LIBRARIES_FAILURE:
      return { ...state, librariesLoading: false, librariesError: action.payload.error || action.payload };

      // LIVROS DA BIBLIOTECA
    case FETCH_LIBRARY_BOOKS_REQUEST:
      return { ...state, libraryBooksLoading: true, libraryBooksError: null };

    case FETCH_LIBRARY_BOOKS_SUCCESS:
      // Ajustado para aceitar tanto objeto com chave .books quanto payload direto
      return {
        ...state,
        libraryBooksLoading: false,
        libraryBooks: action.payload.books || action.payload,
      };

    case FETCH_LIBRARY_BOOKS_FAILURE:
      return { ...state, libraryBooksLoading: false, libraryBooksError: action.payload.error || action.payload };

      // LIVROS ATUAIS
    case 'FETCH_CHECKED_OUT_START':
      return { ...state, checkedOutLoading: true };
    case 'FETCH_CHECKED_OUT_SUCCESS':
      return { ...state, checkedOutLoading: false, checkedOutBooks: action.payload };
    case 'FETCH_CHECKED_OUT_ERROR':
      return { ...state, checkedOutLoading: false, checkedOutError: action.payload };

// HISTÓRICO
    case 'FETCH_HISTORY_START':
      return { ...state, historyLoading: true };
    case 'FETCH_HISTORY_SUCCESS':
      return { ...state, historyLoading: false, checkoutHistory: action.payload };
    case 'FETCH_HISTORY_ERROR':
      return { ...state, historyLoading: false, historyError: action.payload };

      // ADIÇÃO/EDIÇÃO DE STOCK
    case ADD_LIBRARY_BOOK_REQUEST:
    case UPDATE_LIBRARY_BOOK_REQUEST:
      return { ...state, booksLoading: true, booksError: null };

    case ADD_LIBRARY_BOOK_SUCCESS:
    case UPDATE_LIBRARY_BOOK_SUCCESS:
      return { ...state, booksLoading: false };

    case ADD_LIBRARY_BOOK_FAILURE:
    case UPDATE_LIBRARY_BOOK_FAILURE:
      return { ...state, booksLoading: false, booksError: action.payload.error || action.payload };

  // EXTEND CHECKOUT
  case 'EXTEND_CHECKOUT_START':
  return {
    ...state,
    extendLoading: true,
    extendError: null,
    extendingCheckoutId: action.payload?.checkoutId || null,
  };

case 'EXTEND_CHECKOUT_SUCCESS': {
    const checkoutId = action.payload?.checkoutId;

    // tenta aproveitar a resposta (se vier com dueDate nova),
    // mas mesmo que não venha, marcamos como estendido e o refresh no UI trata do resto
    const newDueDate = action.payload?.data?.dueDate;

    const updated = (state.checkedOutBooks || []).map((c) => {
      if (String(c?.id) !== String(checkoutId)) return c;

      return {
        ...c,
        ...(newDueDate ? { dueDate: newDueDate } : {}),
        _extendedLocal: true, // para mostrar "(data estendida)" na UI
      };
    });

    return {
      ...state,
      extendLoading: false,
      extendError: null,
      extendingCheckoutId: null,
      checkedOutBooks: updated,
    };
  }

case 'EXTEND_CHECKOUT_ERROR':
  return {
    ...state,
    extendLoading: false,
    extendError: action.payload?.error || action.payload,
    extendingCheckoutId: null,
  };

default:
  return state;
}




};

export default reducer;
