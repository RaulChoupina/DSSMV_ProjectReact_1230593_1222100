// src/service/service.js
export const BASE_URL = 'http://193.136.62.24';

export function makeHTTPRequest(path, request, success, failure) {
  const url = `${BASE_URL}${path}`;

  fetch(url, request)
    .then(async (res) => {
      // Lê sempre como texto primeiro (para evitar json() em body vazio)
      const text = await res.text();

      // Se não for OK, tenta extrair mensagem (json ou texto)
      if (!res.ok) {
        let message = `HTTP error ${res.status}`;

        // tenta JSON (se houver)
        if (text) {
          try {
            const body = JSON.parse(text);
            message = body?.message || body?.error || message;
          } catch (e) {
            // se não for JSON, usa o próprio texto
            message = text || message;
          }
        }

        throw new Error(message);
      }

      // Se for 204 ou body vazio, devolve null (e continua)
      if (!text) return null;

      // Se houver body, tenta JSON; se não for JSON, devolve texto
      try {
        return JSON.parse(text);
      } catch (e) {
        return text;
      }
    })
    .then((data) => success(data))
    .catch((err) => failure(err?.message ?? String(err)));
}
