// src/context/libraryActions.js
import { makeHTTPRequest } from '../service/service';
import {
  FETCH_LIBRARIES_REQUEST,
  FETCH_LIBRARIES_SUCCESS,
  FETCH_LIBRARIES_FAILURE,
  FETCH_LIBRARY_BOOKS_REQUEST,
  FETCH_LIBRARY_BOOKS_SUCCESS,
  FETCH_LIBRARY_BOOKS_FAILURE,
} from './ActionTypes';

/* =========================
   ACTION CREATORS (síncronas)
   ========================= */

const fetchLibrariesRequest = () => ({
  type: FETCH_LIBRARIES_REQUEST,
});

const fetchLibrariesSuccess = (libraries) => ({
  type: FETCH_LIBRARIES_SUCCESS,
  payload: { libraries },
});

const fetchLibrariesFailure = (errorMessage) => ({
  type: FETCH_LIBRARIES_FAILURE,
  payload: { error: errorMessage },
});

/* =========================
   FUNÇÕES ASSÍNCRONAS (TP style)
   ========================= */

// GET /libraries
export function fetchLibraries(dispatch) {
  dispatch(fetchLibrariesRequest());

  const path = '/v1/library'; // ajusta se o teu endpoint for diferente
  const request = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  };

  const success = (data) => {
    // data é o JSON retornado pelo backend (não existe data.data)
    dispatch(fetchLibrariesSuccess(data));
  };

  const failure = (errMsg) => {
    console.log('fetchLibraries error:', errMsg);
    dispatch(fetchLibrariesFailure(errMsg));
  };

  makeHTTPRequest(path, request, success, failure);
}

export function fetchLibraryBooks(dispatch, libraryId) {
  dispatch({ type: FETCH_LIBRARY_BOOKS_REQUEST });


  const path = `/v1/library/${libraryId}/book`;

  const request = {
    method: 'GET',
    headers: { Accept: 'application/json' },
  };

  const success = (data) => {
    // data deve ser um array de livros
    dispatch({
      type: FETCH_LIBRARY_BOOKS_SUCCESS,
      payload: { books: Array.isArray(data) ? data : (data?.books ?? []) },
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

// POST /libraries
export function addLibrary(dispatch, libraryData) {
  const path = '/v1/library';
  const request = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(libraryData),
  };

  const success = (_data) => {
    // depois de criar, recarrega lista (como fazias antes)
    fetchLibraries(dispatch);
  };

  const failure = (errMsg) => {
    console.log('addLibrary error:', errMsg);
    // mantém o comportamento de "propagar erro" para a screen
    throw new Error(errMsg);
  };

  makeHTTPRequest(path, request, success, failure);
}

// PUT /libraries/{id}
export function editLibrary(dispatch, id, libraryData) {
  const path = `/v1/library/${id}`;
  const request = {
    method: 'PUT', // ou PATCH se for o teu caso
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(libraryData),
  };

  const success = (_data) => {
    fetchLibraries(dispatch);
  };

  const failure = (errMsg) => {
    console.log('editLibrary error:', errMsg);
    throw new Error(errMsg);
  };

  makeHTTPRequest(path, request, success, failure);
}

// DELETE /libraries/{id}
export function removeLibrary(dispatch, id) {
  const path = `/v1/library/${id}`;
  const request = {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
  };

  const success = (_data) => {
    fetchLibraries(dispatch);
  };

  const failure = (errMsg) => {
    console.log('removeLibrary error:', errMsg);
    throw new Error(errMsg);
  };




  makeHTTPRequest(path, request, success, failure);
}
