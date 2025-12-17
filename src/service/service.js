// Service.js
// Igual ao modelo das TPs: função genérica para falar com a API

const BASE_URL = 'http://193.136.62.24/';

export function makeHTTPRequest(path, request, success, failure) {
  const url = `${BASE_URL}${path}`;

  fetch(url, request)
    .then(async (res) => {
      if (!res.ok) {
        // tenta extrair mensagem de erro do body, se existir
        let message = `HTTP error ${res.status}`;
        try {
          const body = await res.json();
          if (body && body.message) {
            message = body.message;
          }
        } catch (e) {
          // ignora, fica a mensagem genérica
        }
        throw new Error(message);
      }
      return res.json();
    })
    .then((data) => success(data))
    .catch((err) => failure(err.message ?? String(err)));
}
