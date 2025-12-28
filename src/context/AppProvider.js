// src/context/AppProvider.js
import React, { Component } from 'react';
import { Provider } from './AppContext';
import reducer from './reducer';

const initialState = {
  libraries: [],
  librariesLoading: false,
  librariesError: null,
  users: [],
  usersLoading: false, // Adicione este
  usersError: null,    // Adicione este
  userHistory: [], // Garanta que começa como um array vazio
  userHistoryLoading: false,
  userHistoryError: null
};

class AppProvider extends Component {
  constructor(props) {
    super(props);
    this.state = initialState;
  }

  dispatch = (action) =>
    this.setState((state) => reducer(state, action));

  render() {
    return (
      <Provider
        value={{
          state: this.state,
          dispatch: this.dispatch,
        }}
      >
        {this.props.children}
      </Provider>
    );
  }
}

export default AppProvider;
