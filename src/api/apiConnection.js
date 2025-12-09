import axios from 'axios';

const api = axios.create({
  baseURL: 'http://193.136.62.24/v1',
  timeout: 5000,
});

export default api;
