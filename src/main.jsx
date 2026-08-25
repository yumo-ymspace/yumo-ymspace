import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Change 'app.jsx' to './App.jsx' (or './App' if your bundler resolves extensions)
import App from './app.jsx' 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)