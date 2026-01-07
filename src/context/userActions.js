// src/context/userActions.js
import { makeHTTPRequest } from '../service/service';

// 1. Procurar livros que o utilizador TEM atualmente (Checked-out)
export const fetchCheckedOutBooks = (dispatch, userId) => {
    dispatch({ type: 'FETCH_CHECKED_OUT_START' });

    makeHTTPRequest(
        `/v1/user/checked-out?userId=${encodeURIComponent(userId)}`,
        { method: 'GET' },
        (data) => {
            const list = Array.isArray(data) ? data : (data?.items || data?.content || []);
            dispatch({ type: 'FETCH_CHECKED_OUT_SUCCESS', payload: list });
        },
        (error) => dispatch({ type: 'FETCH_CHECKED_OUT_ERROR', payload: error })
    );
};

// 2. Procurar o histórico total de requisições
export const fetchCheckoutHistory = (dispatch, userId) => {
    dispatch({ type: 'FETCH_HISTORY_START' });

    makeHTTPRequest(
        `/v1/user/checkout-history?userId=${encodeURIComponent(userId)}`,
        { method: 'GET' },
        (data) => {
            const list = Array.isArray(data) ? data : (data?.items || data?.content || []);
            dispatch({ type: 'FETCH_HISTORY_SUCCESS', payload: list });
        },
        (error) => dispatch({ type: 'FETCH_HISTORY_ERROR', payload: error })
    );
};
// 3) Estender checkout por ID (UUID)
export const extendCheckout = (dispatch, checkoutId) => {
  dispatch({ type: 'EXTEND_CHECKOUT_START', payload: { checkoutId } });

  return new Promise((resolve, reject) => {
    console.log('EXTEND checkoutId =', checkoutId);

    makeHTTPRequest(
      `/v1/checkout/${encodeURIComponent(checkoutId)}/extend`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
      (data) => {
        dispatch({
          type: 'EXTEND_CHECKOUT_SUCCESS',
          payload: { checkoutId, data },
        });
        resolve(data);
      },
      (error) => {
        dispatch({
          type: 'EXTEND_CHECKOUT_ERROR',
          payload: { checkoutId, error },
        });
        reject(error);
      }
    );
  });
};

