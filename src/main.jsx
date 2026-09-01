import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@ant-design/v5-patch-for-react-19'
import { AuthProvider } from './contexts/AuthProvider.jsx'
import { StyleModeProvider } from './contexts/StyleModeContext.jsx'
import './index.scss'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StyleModeProvider>
          <App />
        </StyleModeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)