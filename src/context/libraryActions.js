// src/context/libraryActions.js
import { getLibraries } from '../api/libraryApi';
import {
  FETCH_LIBRARIES_REQUEST,
  FETCH_LIBRARIES_SUCCESS,
  FETCH_LIBRARIES_FAILURE,
} from './actionTypes';

export const fetchLibraries = async (dispatch) => {
  dispatch({ type: FETCH_LIBRARIES_REQUEST });

  try {
    const response = await getLibraries();
    dispatch({
      type: FETCH_LIBRARIES_SUCCESS,
      payload: { libraries: response.data },
    });
  } catch (error) {
    dispatch({
      type: FETCH_LIBRARIES_FAILURE,
      payload: { error: error.message },
    });
  }
};
