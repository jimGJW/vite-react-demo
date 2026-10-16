import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@ant-design/v5-patch-for-react-19'
import { AuthProvider } from './contexts/AuthProvider.jsx'
import { StyleModeProvider } from './contexts/StyleModeContext.jsx'
import I18nProvider from './i18n/I18nProvider.jsx'
import BootSplash from './components/BootSplash/index.jsx'
import './index.scss'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <BootSplash>
          <AuthProvider>
            <StyleModeProvider>
              <App />
            </StyleModeProvider>
          </AuthProvider>
        </BootSplash>
      </BrowserRouter>
    </I18nProvider>
  </StrictMode>,
)
