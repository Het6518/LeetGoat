import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../styles/content.css";
import Popup from "./Popup";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Popup />
  </StrictMode>
);
