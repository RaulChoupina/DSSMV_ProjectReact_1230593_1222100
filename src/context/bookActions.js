import { makeHTTPRequest } from '../service/service';
import {
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

/* =========================
   GET livros da biblioteca
   ========================= */
export function fetchLibraryBooks(dispatch, libraryId) {
  dispatch({ type: FETCH_LIBRARY_BOOKS_REQUEST });

  const path = `/v1/library/${libraryId}/book`;
  const request = {
    method: 'GET',
    headers: { Accept: 'application/json' },
  };

  const success = (data) => {
    dispatch({
      type: FETCH_LIBRARY_BOOKS_SUCCESS,
      payload: { books: data ?? [] },
    });
  };

  const failure = (errMsg) => {
    dispatch({
      type: FETCH_LIBRARY_BOOKS_FAILURE,
      payload: { error: errMsg },
    });
  };

  makeHTTPRequest(path, request, success, failure);
}

/* =========================
   ➕ ADD book (por ISBN)
   ========================= */
export function addLibraryBook(dispatch, libraryId, isbn, onSuccess, onFailure) {
  dispatch({ type: ADD_LIBRARY_BOOK_REQUEST });

  const path = `/v1/library/${libraryId}/book/${encodeURIComponent(isbn)}`;
  const request = {
    method: 'POST',
    headers: { Accept: 'application/json' },
  };

  const success = () => {
    dispatch({ type: ADD_LIBRARY_BOOK_SUCCESS });
    fetchLibraryBooks(dispatch, libraryId);
    if (onSuccess) onSuccess();
  };

  const failure = (errMsg) => {
    dispatch({
      type: ADD_LIBRARY_BOOK_FAILURE,
      payload: { error: errMsg },
    });
    if (onFailure) onFailure(errMsg);
  };

  makeHTTPRequest(path, request, success, failure);
}

/* =========================
   ✏️ UPDATE book (stock)
   ========================= */
export function updateLibraryBook(
  dispatch,
  libraryId,
  isbn,
  payload,
  onSuccess,
  onFailure
) {
  dispatch({ type: UPDATE_LIBRARY_BOOK_REQUEST });

  const path = `/v1/library/${libraryId}/book/${encodeURIComponent(isbn)}`;
  const request = {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  };

  const success = () => {
    dispatch({ type: UPDATE_LIBRARY_BOOK_SUCCESS });
    fetchLibraryBooks(dispatch, libraryId);
    if (onSuccess) onSuccess();
  };

  const failure = (errMsg) => {
    dispatch({
      type: UPDATE_LIBRARY_BOOK_FAILURE,
      payload: { error: errMsg },
    });
    if (onFailure) onFailure(errMsg);
  };

  makeHTTPRequest(path, request, success, failure);
}
