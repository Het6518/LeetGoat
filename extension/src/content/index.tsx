import React from "react";
import ReactDOM from "react-dom/client";

import "../styles/content.css";

import App from "./App";
import { ThemeProvider } from "../theme/ThemeProvider";

const root = document.createElement("div");

root.id = "leetgoat-root";

document.body.appendChild(root);

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);