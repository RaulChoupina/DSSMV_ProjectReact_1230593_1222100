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
  CHECKOUT_LIBRARY_BOOK_REQUEST,
  CHECKOUT_LIBRARY_BOOK_SUCCESS,
  CHECKOUT_LIBRARY_BOOK_FAILURE,
  CHECKIN_LIBRARY_BOOK_REQUEST,
  CHECKIN_LIBRARY_BOOK_SUCCESS,
  CHECKIN_LIBRARY_BOOK_FAILURE,
  FETCH_TYPEAHEAD_REQUEST,
  FETCH_TYPEAHEAD_SUCCESS,
  FETCH_TYPEAHEAD_FAILURE,
  CLEAR_TYPEAHEAD,
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
    ADD book (por ISBN) + stock
   ========================= */
export function addLibraryBook(
    dispatch,
    libraryId,
    isbn,
    payload,        //  { stock: number }
    onSuccess,
    onFailure
) {
  dispatch({ type: ADD_LIBRARY_BOOK_REQUEST });

  const path = `/v1/library/${libraryId}/book/${encodeURIComponent(isbn)}`;
  const request = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: payload ? JSON.stringify(payload) : undefined,
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
    UPDATE book (stock)
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

/* =========================
    CHECKOUT book (por ISBN + userId)
   POST /v1/library/{libraryId}/book/{isbn}/checkout?userId=...
   ========================= */
export function checkoutLibraryBook(
    dispatch,
    libraryId,
    isbn,
    userId,
    onSuccess,
    onFailure
) {
  dispatch({ type: CHECKOUT_LIBRARY_BOOK_REQUEST });

  const path = `/v1/library/${libraryId}/book/${encodeURIComponent(
      isbn
  )}/checkout?userId=${encodeURIComponent(userId)}`;

  const request = {
    method: 'POST',
    headers: { Accept: 'application/json' },
  };

  const success = (data) => {
    dispatch({ type: CHECKOUT_LIBRARY_BOOK_SUCCESS, payload: { data } });
    fetchLibraryBooks(dispatch, libraryId);
    if (onSuccess) onSuccess(data);
  };

  const failure = (errMsg) => {
    dispatch({
      type: CHECKOUT_LIBRARY_BOOK_FAILURE,
      payload: { error: errMsg },
    });
    if (onFailure) onFailure(errMsg);
  };

  makeHTTPRequest(path, request, success, failure);
}


export function checkinLibraryBook(
    dispatch,
    libraryId,
    isbn,
    userId,
    onSuccess,
    onFailure
) {
  dispatch({ type: CHECKIN_LIBRARY_BOOK_REQUEST });

  const path = `/v1/library/${libraryId}/book/${encodeURIComponent(
      isbn
  )}/checkin?userId=${encodeURIComponent(userId)}`;

  const request = {
    method: 'POST',
    headers: { Accept: 'application/json' },
  };

  const success = (data) => {
    dispatch({ type: CHECKIN_LIBRARY_BOOK_SUCCESS, payload: { data } });
    fetchLibraryBooks(dispatch, libraryId);
    if (onSuccess) onSuccess(data);
  };

  const failure = (errMsg) => {
    dispatch({
      type: CHECKIN_LIBRARY_BOOK_FAILURE,
      payload: { error: errMsg },
    });
    if (onFailure) onFailure(errMsg);
  };

  makeHTTPRequest(path, request, success, failure);
}

/* =========================
    TYPEAHEAD (Search)
   GET /v1/search/typeahead?query=...
   ========================= */
export function fetchTypeahead(dispatch, query) {
  dispatch({ type: FETCH_TYPEAHEAD_REQUEST, payload: { query } });

  const q = (query || '').trim();
  const path = `/v1/search/typeahead?query=${encodeURIComponent(q)}`;
  const request = {
    method: 'GET',
    headers: { Accept: 'application/json' },
  };

  const success = (data) => {
    const results = [
      ...(data?.titles || []),
      ...(data?.authors || []),
      ...(data?.subjects || []),
    ];

    const uniq = [...new Set(results.map((x) => String(x)))].slice(0, 10);

    dispatch({
      type: FETCH_TYPEAHEAD_SUCCESS,
      payload: { items: uniq, query: q },
    });
  };

  const failure = (errMsg) => {
    dispatch({
      type: FETCH_TYPEAHEAD_FAILURE,
      payload: { error: errMsg, query: q },
    });
  };

  makeHTTPRequest(path, request, success, failure);
}

export function clearTypeahead(dispatch) {
  dispatch({ type: CLEAR_TYPEAHEAD });
}
