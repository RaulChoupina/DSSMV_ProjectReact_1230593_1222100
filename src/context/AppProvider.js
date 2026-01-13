// src/context/AppProvider.js
import React, { Component } from 'react';
import { Provider } from './AppContext';
import reducer from './reducer';

const initialState = {
  // LIBRARIES
  libraries: [],
  librariesLoading: false,
  librariesError: null,

  // USERS (mantém se ainda usas)
  users: [],
  usersLoading: false,
  usersError: null,

  // LIVROS DA BIBLIOTECA (o reducer usa estes nomes)
  libraryBooks: [],
  libraryBooksLoading: false,
  libraryBooksError: null,

  checkoutLoading: false,
  checkoutError: null,
  checkinLoading: false,
  checkinError: null,

  // CHECKED-OUT (o reducer usa checkedOutLoading/checkedOutError)
  checkedOutBooks: [],
  checkedOutLoading: false,
  checkedOutError: null,

  // HISTÓRICO (o reducer usa historyLoading/historyError e checkoutHistory)
  checkoutHistory: [],
  historyLoading: false,
  historyError: null,

  // ADD/UPDATE STOCK (o reducer usa booksLoading/booksError)
  booksLoading: false,
  booksError: null,
};

class AppProvider extends Component {
  constructor(props) {
    super(props);
    this.state = initialState;
  }

  dispatch = (action) => this.setState((state) => reducer(state, action));

  render() {
    return (
      <Provider value={{ state: this.state, dispatch: this.dispatch }}>
        {this.props.children}
      </Provider>
    );
  }
}

export default AppProvider;
