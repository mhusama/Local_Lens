import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <>
      <App />
      <Toaster
        position="top-center"
        containerStyle={{
          top: 'max(0.75rem, env(safe-area-inset-top))',
          zIndex: 200,
        }}
        toastOptions={{
          duration: 4000,
          style: { zIndex: 200 },
        }}
      />
    </>
  </StrictMode>,
)
