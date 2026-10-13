import { defineManifest } from "@crxjs/vite-plugin";

const icons = {
  16: "icons/icon16.png",
  32: "icons/icon32.png",
  48: "icons/icon48.png",
  128: "icons/icon128.png",
};

export default defineManifest({
  manifest_version: 3,
  name: "LeetGoat",
  description:
    "Verdict sounds, study plans, snippets, spaced-repetition reviews and a contest cheat check — right inside LeetCode.",
  version: "0.1.0",
  icons,

  action: {
    default_title: "LeetGoat",
    default_popup: "popup.html",
    default_icon: icons,
  },

  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },

  permissions: ["storage", "unlimitedStorage", "alarms", "scripting"],

  host_permissions: ["https://leetcode.com/*"],

  commands: {
    "toggle-sidebar": {
      suggested_key: { default: "Alt+G" },
      description: "Toggle the LeetGoat sidebar",
    },
    "open-snippets": {
      suggested_key: { default: "Alt+S" },
      description: "Open the snippet palette",
    },
  },

  // Injected on every LeetCode page because it's a single-page app: you can
  // land on /problemset and navigate into a problem without a page load.
  content_scripts: [
    {
      matches: ["https://leetcode.com/*"],
      js: ["src/content/index.tsx"],
      run_at: "document_idle",
    },
  ],
});
