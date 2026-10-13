import { PROBLEM_PREFIX, getAllProblems } from "../lib/storage";

const BADGE_ALARM = "leetgoat-badge";
const BRIDGE_ID = "leetgoat-bridge";

/**
 * public/bridge.js must run in the page's own JS world to reach Monaco.
 * Registered dynamically because bundled MAIN-world scripts can't load
 * extension modules.
 */
async function registerBridge() {
  // Re-register every time so updates to the options (e.g. runAt) take effect.
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [BRIDGE_ID] });
  if (existing.length) await chrome.scripting.unregisterContentScripts({ ids: [BRIDGE_ID] });
  await chrome.scripting.registerContentScripts([
    {
      id: BRIDGE_ID,
      js: ["bridge.js"],
      matches: ["https://leetcode.com/*"],
      // Before LeetCode's own scripts, so its fetch calls go through our hook.
      runAt: "document_start",
      world: "MAIN",
      persistAcrossSessions: true,
    },
  ]);
}

/** Shows how many reviews are due on the toolbar icon. */
async function refreshBadge() {
  const now = Date.now();
  const due = (await getAllProblems()).filter((p) => p.review && p.review.due <= now).length;
  await chrome.action.setBadgeText({ text: due > 0 ? String(due) : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#d97706" });
  await chrome.action.setBadgeTextColor?.({ color: "#ffffff" });
}

async function ensureAlarm() {
  // Reviews become due at midnight, so re-check periodically even with no writes.
  if (!(await chrome.alarms.get(BADGE_ALARM))) {
    await chrome.alarms.create(BADGE_ALARM, { periodInMinutes: 30 });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void registerBridge();
  void ensureAlarm();
  void refreshBadge();
});

chrome.runtime.onStartup.addListener(() => {
  void registerBridge();
  void ensureAlarm();
  void refreshBadge();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === BADGE_ALARM) void refreshBadge();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && Object.keys(changes).some((k) => k.startsWith(PROBLEM_PREFIX))) {
    void refreshBadge();
  }
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== "toggle-sidebar" && command !== "open-snippets") return;
  void (async () => {
    const target = tab?.id ? tab : (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
    if (target?.id) {
      chrome.tabs.sendMessage(target.id, { type: command }).catch(() => undefined);
    }
  })();
});
