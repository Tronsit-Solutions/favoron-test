import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ModalStateProvider } from "./contexts/ModalStateContext"
import ErrorBoundary from "./components/ErrorBoundary"

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <ModalStateProvider>
      <App />
    </ModalStateProvider>
  </ErrorBoundary>
);
