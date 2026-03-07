import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installDevConsoleFilters } from './utils/installDevConsoleFilters.ts'
import { debugInfo, installRuntimeErrorLogging } from './utils/debug.ts'

installDevConsoleFilters()
installRuntimeErrorLogging()

debugInfo('bootstrap', 'Starting application bootstrap')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
