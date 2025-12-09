// src/api/libraryApi.js
import api from './apiConnection';

// GET /v1/library  -> lista de bibliotecas
export const getLibraries = () => api.get('/library');

// (mais tarde usaremos estes dois)
export const getLibraryById = (id) => api.get(`/library/${id}`);

export const getBooksByLibrary = (libraryId, limit) => {
  const params = {};
  if (limit != null) params.limit = limit;
  return api.get(`/library/${libraryId}/book`, { params });
};
