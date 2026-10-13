# LeetGoat Privacy Policy

_Last updated: October 13, 2026_

LeetGoat is a browser extension that adds practice tools to leetcode.com. This policy explains what it does with data.

## What LeetGoat stores

Everything LeetGoat saves stays **in your own browser**, in Chrome's extension storage (`chrome.storage.local`):

- problems you've opened, your timer totals, attempts and review schedule
- your settings, study-plan choice and custom snippets
- audio clips you choose to upload for verdict sounds

None of this is sent to the developer or any third party. You can export it as a JSON file or delete it from **Settings → Your data**. Uninstalling the extension also removes it.

## Network requests

LeetGoat only talks to **leetcode.com**. It uses LeetCode's own web APIs to:

- load the problem you're viewing, the daily challenge and study-plan status
- detect your submission results while you use LeetCode
- read public contest history and Code Replay data when you run a cheat check on a profile

These requests go directly from your browser to LeetCode, using your existing LeetCode session. Nothing goes through a LeetGoat server, because there isn't one.

## What LeetGoat does not do

- no analytics, tracking or advertising
- no selling or sharing of data
- no reading of pages other than leetcode.com

## Permissions

| Permission | Why |
| --- | --- |
| `storage`, `unlimitedStorage` | Save your progress and settings locally |
| `alarms` | Refresh the due-review count on the toolbar icon |
| `scripting` | Run a small helper inside LeetCode pages, to reach the code editor and read submission results |
| `https://leetcode.com/*` | Show the sidebar and talk to LeetCode's APIs |

## Contact

Questions: open an issue at https://github.com/Het6518/LeetGoat/issues
