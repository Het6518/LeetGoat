import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import css from "../styles/content.css?inline";
import App from "./App";

const HOST_ID = "leetgoat-host";

/**
 * Tailwind v4 relies on @property registrations, which are ignored inside a
 * shadow root. Registering them at document level fixes that; they're
 * rewritten to `syntax: "*"` so LeetCode's own (Tailwind v3) variables keep
 * accepting whatever values the page assigns.
 */
function registerCssProperties(source: string) {
  if (document.getElementById("leetgoat-properties")) return;
  const rules = source.match(/@property\s+--tw-[\w-]+\s*\{[^}]*\}/g);
  if (!rules) return;
  const style = document.createElement("style");
  style.id = "leetgoat-properties";
  style.textContent = rules.map((r) => r.replace(/syntax\s*:\s*"[^"]*"/, 'syntax: "*"')).join("\n");
  document.head.appendChild(style);
}

function mount() {
  if (document.getElementById(HOST_ID)) return;

  // Shadow DOM keeps LeetCode's CSS out of our UI and ours out of theirs.
  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.cssText = "all: initial;";
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = css;
  shadow.appendChild(style);
  registerCssProperties(css);

  const container = document.createElement("div");
  shadow.appendChild(container);
  document.body.appendChild(host);

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

mount();
