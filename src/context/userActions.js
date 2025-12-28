import { makeHTTPRequest } from '../service/service';

// Procura a lista de todos os utilizadores
export const fetchUsers = (dispatch) => {
    dispatch({ type: 'FETCH_USERS_START' });

    makeHTTPRequest(
        '/v1/users',
        { method: 'GET' },
        (data) => {
            // ✅ FORÇA A SER UM ARRAY. Se a API enviar { users: [...] }, extrai a lista.
            const finalData = Array.isArray(data) ? data : (data?.users || data?.items || []);
            dispatch({ type: 'FETCH_USERS_SUCCESS', payload: finalData });
        },
        (error) => {
            dispatch({ type: 'FETCH_USERS_ERROR', payload: error });
        }
    );
};

// Procura o histórico de checkouts de um utilizador específico
export const fetchUserHistory = (dispatch, userId) => {
    dispatch({ type: 'FETCH_USER_HISTORY_START' });

    makeHTTPRequest(
        `/v1/users/${encodeURIComponent(userId)}/checkouts`,
        { method: 'GET' },
        (data) => {
            // ✅ Garante que enviamos a lista de checkouts, mesmo que venha dentro de um objeto
            const checkouts = Array.isArray(data) ? data : (data?.checkouts || data?.items || []);
            dispatch({ type: 'FETCH_USER_HISTORY_SUCCESS', payload: checkouts });
        },
        (error) => {
            dispatch({ type: 'FETCH_USER_HISTORY_ERROR', payload: error });
        }
    ); // Fechamento correto do makeHTTPRequest
}; // Fechamento correto da função

// Extende o prazo de um checkout
export const extendCheckout = (dispatch, checkoutId, callback) => {
    makeHTTPRequest(
        `/v1/users/checkouts/${encodeURIComponent(checkoutId)}/extend`,
        { method: 'PUT' },
        (data) => {
            if (callback) callback(true, data);
        },
        (error) => {
            if (callback) callback(false, error);
        }
    );
};