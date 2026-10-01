import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import App from './App';
import { StoreProvider } from './store';
import './theme.css';

// The hosted preview runs in a sandboxed frame without a usable URL, so it uses an in-memory router.
const Router = import.meta.env.VITE_ROUTER === 'memory' ? MemoryRouter : BrowserRouter;
const routerProps = import.meta.env.VITE_ROUTER === 'memory' ? { initialEntries: ['/board'] } : {};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router {...routerProps}>
      <StoreProvider>
        <App />
      </StoreProvider>
    </Router>
  </StrictMode>,
);
