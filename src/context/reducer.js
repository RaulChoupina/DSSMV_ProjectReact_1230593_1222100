// src/context/reducer.js
import {
  FETCH_LIBRARIES_REQUEST,
  FETCH_LIBRARIES_SUCCESS,
  FETCH_LIBRARIES_FAILURE,
} from './ActionTypes';

const reducer = (state, action) => {
  switch (action.type) {
    case FETCH_LIBRARIES_REQUEST:
      return {
        ...state,
        librariesLoading: true,
        librariesError: null,
      };

    case FETCH_LIBRARIES_SUCCESS:
      return {
        ...state,
        librariesLoading: false,
        libraries: action.payload.libraries,
      };

    case FETCH_LIBRARIES_FAILURE:
      return {
        ...state,
        librariesLoading: false,
        librariesError: action.payload.error,
      };

    default:
      return state;
  }
};

export default reducer;
