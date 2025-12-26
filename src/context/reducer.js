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
      return {
        ...state,
        librariesLoading: true,
        librariesError: null,
      };

    case FETCH_LIBRARIES_SUCCESS:
      return {
        ...state,
        librariesLoading: false,
        libraries: action.payload.libraries,
      };

    case FETCH_LIBRARIES_FAILURE:
      return {
        ...state,
        librariesLoading: false,
        librariesError: action.payload.error,
      };

    //  LIVROS DA BIBLIOTECA
    case FETCH_LIBRARY_BOOKS_REQUEST:
      return {
        ...state,
        libraryBooksLoading: true,
        libraryBooksError: null,
      };

    case FETCH_LIBRARY_BOOKS_SUCCESS:
      return {
        ...state,
        libraryBooksLoading: false,
        libraryBooks: action.payload.books,
      };

    case FETCH_LIBRARY_BOOKS_FAILURE:
      return {
        ...state,
        libraryBooksLoading: false,
        libraryBooksError: action.payload.error,
      };

    case ADD_LIBRARY_BOOK_REQUEST:
      return {
        ...state,
        booksLoading: true,
        booksError: null
      };

    case ADD_LIBRARY_BOOK_SUCCESS:
      return {
        ...state,
        booksLoading: false
      };

    case ADD_LIBRARY_BOOK_FAILURE:
      return {
        ...state,
        booksLoading: false,
        booksError: action.payload.error
      };

    case UPDATE_LIBRARY_BOOK_REQUEST:
      return {
        ...state,
        booksLoading: true,
        booksError: null

      };

    case UPDATE_LIBRARY_BOOK_SUCCESS:
      return {
        ...state,
        booksLoading: false
      };

    case UPDATE_LIBRARY_BOOK_FAILURE:
      return {
        ...state,
        booksLoading: false,
        booksError: action.payload.error
      };

    default:
      return state;
  }
};

export default reducer;
