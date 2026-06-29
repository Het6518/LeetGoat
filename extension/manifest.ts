import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "LeetGoat",
  version: "0.0.1",

  action: {
    default_title: "LeetGoat",
  },

  permissions: ["storage"],

  host_permissions: [
    "https://leetcode.com/*",
  ],

  content_scripts: [
    {
      matches: ["https://leetcode.com/problems/*"],
      js: ["src/content/index.tsx"],
    },
  ],
});