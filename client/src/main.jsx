import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Fast API port detection on startup
const detectApiUrl = async () => {
  const current = localStorage.getItem('fince_api_url');
  let detected = 'http://localhost:3000';
  
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 600);
    // Ping 3000
    await fetch('http://localhost:3000/', { signal: controller.signal });
    clearTimeout(id);
    detected = 'http://localhost:3000';
  } catch (e) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 600);
      // Ping 2000
      await fetch('http://localhost:2000/', { signal: controller.signal });
      clearTimeout(id);
      detected = 'http://localhost:2000';
    } catch (e2) {
      // Default fallback
      detected = 'http://localhost:3000';
    }
  }

  if (current !== detected) {
    localStorage.setItem('fince_api_url', detected);
    window.location.reload();
    // Return a promise that never resolves to prevent rendering outdated modules before reload
    return new Promise(() => {});
  }
};

detectApiUrl().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
});
