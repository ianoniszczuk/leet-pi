import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Auth0ProviderWrapper } from '@/config/auth0'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Auth0ProviderWrapper>
        <App />
      </Auth0ProviderWrapper>
    </BrowserRouter>
  </React.StrictMode>,
)
