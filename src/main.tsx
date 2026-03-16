import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// Catch unhandled promise rejections globally — prevents silent failures
window.addEventListener('unhandledrejection', (event) => {
  console.error('[UnhandledRejection]', event.reason);
  // Prevent the default browser "Uncaught (in promise)" noise in production
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);
