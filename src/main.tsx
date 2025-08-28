import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ModalStateProvider } from "./contexts/ModalStateContext"

createRoot(document.getElementById("root")!).render(
  <ModalStateProvider>
    <App />
  </ModalStateProvider>
);
