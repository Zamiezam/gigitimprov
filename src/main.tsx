// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import 'leaflet/dist/leaflet.css';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { PaymentProvider } from './context/PaymentContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <PaymentProvider>
        <App />
      </PaymentProvider>
    </AuthProvider>
  </StrictMode>,
);