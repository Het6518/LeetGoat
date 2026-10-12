<div align="center">

<img src="extension/public/icons/icon128.png" width="96" alt="LeetGoat logo" />

# LeetGoat

**A Chrome extension that makes LeetCode practice stick.**

Verdict sounds and banners · interview study plans · snippet library · spaced-repetition reviews · focus timer · contest cheat check

</div>

---

## Features

### On every problem
- **ACCEPTED / REJECTED banner with sound.** Accepted shows a big green banner and a fanfare. Wrong Answer, TLE, runtime or compile errors show a red banner, the exact reason, and a dramatic *"faaah"*. You can upload your own clips.
- **Focus timer.** Starts automatically, pauses when you leave the tab, survives reloads, and nudges you when you're past your target time.
- **Complexity budget.** Reads the constraints and tells you what to aim for, e.g. `n ≤ 10⁵` → *O(n log n)*. It also warns about integer overflow and `mod 10⁹+7`.
- **Hints one at a time**, spoiler-free topic tags, and similar problems with your solved status.
- **Snippet library** (`Alt+S`). Interview templates (binary search, sliding window, union-find, BFS, Dijkstra, topological sort, trie, monotonic stack, backtracking, prefix sums) in Python, C++ and Java, inserted at your cursor. You can add your own.
- **Honest practice.** Code pasted in from outside LeetCode is noted, so a pasted solution doesn't count as "solved it myself".

### Long-term progress
- **Spaced-repetition reviews.** After each Accepted, rate how it went. LeetGoat brings the problem back right before you'd forget it, and the due count shows on the toolbar icon.
- **Study plans.** Grind 75, NeetCode 150 and Blind 75, synced with what you've solved on LeetCode, plus a one-click "next problem" button.

### Contest cheat check
Open any LeetCode profile and tap the 🛡 in the floating dock. LeetGoat reads LeetCode's own **Code Replay** for every contest that account has taken and flags problems with an **External Paste over 200 characters**. If that happens in at least half of their contests, the verdict is **Likely a cheater**; otherwise it's **Not a cheater**. You can see exactly what was pasted.

### Always there
A small draggable **floating dock** on every LeetCode page holds the sidebar toggle, live timer, snippets, next problem and sound toggle. `Alt+G` opens the sidebar.

---

## Install

### Option 1: Chrome Web Store
*Coming soon.* Once it's published, you'll install it with one click and get updates automatically.

### Option 2: Install from a release (no coding needed)
1. Download the latest `leetgoat-x.y.z.zip` from the [Releases page](https://github.com/Het6518/LeetGoat/releases) and **unzip it**.
2. Open `chrome://extensions` in Chrome (Edge: `edge://extensions`, Brave: `brave://extensions`).
3. Turn on **Developer mode** (top-right switch).
4. Click **Load unpacked** and select the unzipped folder, the one that contains `manifest.json`.
5. Open any problem on [leetcode.com](https://leetcode.com/problemset/). The goat dock appears at the bottom-right.

> To update: replace the folder with the new release, then click **↻ Reload** on LeetGoat in `chrome://extensions` and refresh your LeetCode tabs.

### Option 3: Build it yourself
Requires [Node.js](https://nodejs.org/) 20 or newer.

```bash
git clone https://github.com/Het6518/LeetGoat.git
cd LeetGoat/extension
npm install
npm run build
```

Then follow steps 2–5 above, selecting `extension/dist`.

---

## Usage

| Where | What you get |
| --- | --- |
| **Problem page** | Sidebar tabs: **Solve** · **Plan** · **Review**. Dock: timer, `{ }` snippets, ⏭ next, 🔊 sound |
| **Profile page** `/u/<name>/` | Dock 🛡 → cheat check for that account |
| **Any other LeetCode page** | **Plan** · **Review** · **Cheat check** (type any username) |
| **Toolbar icon** | Daily challenge, reviews due, study plan, settings |

| Shortcut | Action |
| --- | --- |
| `Alt+G` | Toggle the sidebar |
| `Alt+S` | Open the snippet palette |
| `Esc` | Close the sidebar or palette |

You can change shortcuts at `chrome://extensions/shortcuts`. Settings (⚙ in the sidebar) cover target times, auto-timer, hidden topics, interview mode, paste tracking, sounds, theme, and export/import of your data.

---

## Privacy

Everything is stored **locally in your browser**. LeetGoat talks only to leetcode.com and has no server, analytics or tracking. See [PRIVACY.md](PRIVACY.md).

---

## Development

```bash
cd extension
npm install
npm run dev        # rebuilds on change; also serves the UI playground
npm run build      # production build → dist/
npm run release    # build + pack → release/leetgoat-<version>.zip
npm run lint
npm run icons      # regenerate PNG icons from the goat mark
```

- **Playground:** with `npm run dev` running, open `http://localhost:5173/playground.html` to work on the sidebar and popup outside Chrome. It uses fake storage and sample LeetCode data.
- **How it works:** open [`extension/docs/how-it-works.html`](extension/docs/how-it-works.html) in a browser for an architecture diagram and step-by-step flows.

**Stack:** React 19 · TypeScript · Tailwind CSS 4 · Vite + CRXJS · Manifest V3.

```
extension/
├── manifest.ts            extension definition (permissions, shortcuts, scripts)
├── public/bridge.js       runs inside LeetCode's page: verdicts, editor, pastes
└── src/
    ├── background/        service worker: shortcuts, badge, bridge registration
    ├── content/           on-page app: dock, sidebar, verdict banner
    ├── popup/             toolbar popup
    ├── components/        UI pieces (solve, plan, contest, snippets, shared, ui)
    ├── hooks/             page detection, timer, live storage
    ├── lib/               storage, reviews, constraints, sounds, cheat check, plans
    ├── api/leetcode.ts    every request to LeetCode
    └── data/              study plans and snippet templates
```

---

## Publishing a release

**GitHub release** (free; people install with "Load unpacked"):
1. Bump `version` in `extension/manifest.ts`.
2. Run `npm run release` in `extension/`.
3. On GitHub: **Releases → Draft a new release**, tag it (e.g. `v0.1.0`), and attach `extension/release/leetgoat-0.1.0.zip`.

**Chrome Web Store** (one-click install and auto-updates for users):
1. Register at the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole). There's a one-time $5 fee.
2. **New item** → upload the same zip.
3. Fill in the listing: description, at least one 1280×800 screenshot, the 128×128 icon (`extension/public/icons/icon128.png`), category *Developer Tools*, and a link to [PRIVACY.md](PRIVACY.md) as the privacy policy.
4. Under **Privacy practices**, justify each permission (the table in PRIVACY.md covers them) and declare that no user data is collected.
5. Submit for review. It usually takes a few days.

The same zip also works for [Microsoft Edge Add-ons](https://partner.microsoft.com/dashboard/microsoftedge/overview), where publishing is free.

---

## Disclaimer

LeetGoat is an independent project and isn't affiliated with or endorsed by LeetCode. The cheat check shows signals from LeetCode's public replay data, not proof; please don't harass anyone over it.
