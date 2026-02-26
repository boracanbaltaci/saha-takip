import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const style = document.createElement('style');
style.textContent = `
  * { box-sizing: border-box; }
  html, body { 
    overflow-x: hidden; 
    margin: 0; padding: 0;
    background: #0F172A;
  }
  body { touch-action: pan-y; }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
