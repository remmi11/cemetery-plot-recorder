import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import 'react-confirm-alert/src/react-confirm-alert.css';

import { Provider } from 'react-redux';
import store from './redux/store';

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>, document.getElementById('root'));
