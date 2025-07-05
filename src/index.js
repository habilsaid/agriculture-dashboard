import React from 'react';
import ReactDOM from 'react-dom/client'; // This is the correct import for React 18+
import './index.css';
import './styles/tailwind.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// React 18+ way of rendering
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


reportWebVitals();