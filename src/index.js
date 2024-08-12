// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Userform from './Userform';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

ReactDOM.render(
  <React.StrictMode>
    <Userform />
  </React.StrictMode>,
  document.getElementById('root')
);

// Register the service worker
serviceWorkerRegistration.register();
