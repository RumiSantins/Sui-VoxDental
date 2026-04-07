import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { LanguageProvider } from './context/LanguageContext'
import './index.css'
import App from './App.jsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1016312052696-jcfpcaac5op4ifa4gb2f67pi4irufgr7.apps.googleusercontent.com"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
