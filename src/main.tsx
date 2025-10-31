import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize theme on app load
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const initialTheme = savedTheme || systemTheme;
  
  document.documentElement.classList.toggle('dark', initialTheme === 'dark');
};

initializeTheme();

createRoot(document.getElementById("root")!).render(<App />);
