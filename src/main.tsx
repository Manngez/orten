import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./online.css";
import "./country-menu.css";
import "./germanySecretExtension";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
