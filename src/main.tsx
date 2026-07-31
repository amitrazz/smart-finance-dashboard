import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global unhandled async rejection capture — surfaces issues in developer console without crashing the app
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const msg =
    reason !== null && typeof reason === "object" && "userMessage" in reason
      ? String((reason as { userMessage: unknown }).userMessage)
      : reason !== null && typeof reason === "object" && "message" in reason
      ? String((reason as { message: unknown }).message)
      : String(reason);

  console.error("[UnhandledRejection]", { reason, msg, timestamp: new Date().toISOString() });
});

// Global runtime error capture
window.addEventListener("error", (event) => {
  console.error("[RuntimeError]", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    timestamp: new Date().toISOString(),
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
