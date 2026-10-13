// LeetGoat page bridge — runs in LeetCode's own JS world (registered by the
// background worker with world: "MAIN") because Monaco and CodeMirror are
// only reachable from there. Talks to the content script via postMessage.
(() => {
  if (window.__leetgoatBridge) return;
  window.__leetgoatBridge = true;

  const PASTE_MIN_CHARS = 40;
  const recentCopies = [];
  let lastFocused = null;

  const norm = (s) => s.replace(/\s+/g, "");

  // ---- Submission verdicts ---------------------------------------------------
  // LeetCode polls /submissions/detail/<id>/check/ until the judge finishes.
  // Watching that response is far more reliable than scraping the result UI.
  // ("Run" uses non-numeric ids like runcode_…, so only real submits match.)
  // Both the classic and the newer /v2/check/ endpoint.
  const CHECK_URL = /\/submissions\/detail\/(\d+)\/(?:v2\/)?check\/?/;
  const STATUS_NAMES = {
    10: "Accepted",
    11: "Wrong Answer",
    12: "Memory Limit Exceeded",
    13: "Output Limit Exceeded",
    14: "Time Limit Exceeded",
    15: "Runtime Error",
    16: "Internal Error",
    20: "Compile Error",
    30: "Timeout",
  };
  const reported = new Set();

  function reportCheck(url, body) {
    const match = CHECK_URL.exec(url);
    if (!match || !body || body.state !== "SUCCESS") return;
    // v2 can keep judging after state=SUCCESS; wait until that's done too.
    if (/^(PENDING|STARTED)$/i.test(String(body.ai_state ?? ""))) return;
    const code = Number(body.status_code ?? body.judger_status_code);
    if (!code) return;
    body.status_code = code;
    body.status_msg = body.status_msg || STATUS_NAMES[code] || "Rejected";
    const submissionId = match[1];
    if (reported.has(submissionId)) return;
    reported.add(submissionId);
    window.postMessage(
      {
        __leetgoat: "from-page",
        type: "event",
        event: "verdict",
        submissionId,
        statusCode: body.status_code,
        statusMsg: body.status_msg || "",
      },
      window.location.origin
    );
  }

  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    const promise = originalFetch.apply(this, arguments);
    try {
      const url = typeof input === "string" ? input : (input && input.url) || String(input);
      if (CHECK_URL.test(url)) {
        promise
          .then((res) => res.clone().json())
          .then((body) => reportCheck(url, body))
          .catch(() => {});
      }
    } catch {
      /* never break the page's own requests */
    }
    return promise;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    if (CHECK_URL.test(String(url))) {
      this.addEventListener("load", () => {
        try {
          reportCheck(String(url), JSON.parse(this.responseText));
        } catch {
          /* not JSON */
        }
      });
    }
    return originalOpen.apply(this, arguments);
  };

  function rememberCopy(text) {
    const n = norm(text || "");
    if (!n) return;
    recentCopies.unshift(n);
    recentCopies.length = Math.min(recentCopies.length, 8);
  }

  function codeEditors() {
    const m = window.monaco;
    if (!m || !m.editor || !m.editor.getEditors) return [];
    return m.editor.getEditors().filter((e) => {
      const model = e.getModel();
      return model && model.getLanguageId() !== "plaintext" && e.getDomNode() && e.getDomNode().offsetHeight > 40;
    });
  }

  function mainEditor() {
    const editors = codeEditors();
    if (lastFocused && editors.includes(lastFocused)) return lastFocused;
    return editors.sort((a, b) => b.getDomNode().offsetHeight - a.getDomNode().offsetHeight)[0] || null;
  }

  function post(message) {
    window.postMessage({ __leetgoat: "from-page", ...message }, window.location.origin);
  }

  const attached = new WeakSet();
  function attach(editor) {
    if (attached.has(editor)) return;
    attached.add(editor);
    editor.onDidFocusEditorText(() => (lastFocused = editor));
    editor.onDidPaste((e) => {
      const model = editor.getModel();
      if (!model || model.getLanguageId() === "plaintext") return;
      const text = model.getValueInRange(e.range);
      const n = norm(text);
      if (n.length < PASTE_MIN_CHARS) return;
      const internal = recentCopies.some((c) => c.includes(n) || n.includes(c));
      post({ type: "event", event: "paste", chars: n.length, lines: text.split("\n").length, external: !internal });
    });
  }

  function attachAll() {
    const m = window.monaco;
    if (!m || !m.editor) return false;
    m.editor.getEditors().forEach(attach);
    return true;
  }

  // Monaco loads lazily; poll until it shows up, then hook new editors.
  const wait = setInterval(() => {
    if (!attachAll()) return;
    clearInterval(wait);
    if (window.monaco.editor.onDidCreateEditor) window.monaco.editor.onDidCreateEditor((e) => setTimeout(() => attach(e), 0));
  }, 1000);
  setInterval(attachAll, 5000);

  // Track copies so pasting your own code back in isn't flagged as external.
  document.addEventListener(
    "keydown",
    (e) => {
      if (!(e.ctrlKey || e.metaKey) || (e.key !== "c" && e.key !== "x")) return;
      for (const editor of codeEditors()) {
        if (!editor.hasTextFocus()) continue;
        const sel = editor.getSelection();
        if (sel && !sel.isEmpty()) rememberCopy(editor.getModel().getValueInRange(sel));
      }
    },
    true
  );
  document.addEventListener("copy", () => rememberCopy(String(window.getSelection() || "")), true);

  function indentLike(editor, text) {
    const pos = editor.getPosition();
    const line = editor.getModel().getLineContent(pos.lineNumber);
    const before = line.slice(0, pos.column - 1);
    const indent = /^\s*$/.test(before) ? before : (line.match(/^\s*/) || [""])[0];
    return text
      .split("\n")
      .map((l, i) => (i === 0 || !l ? l : indent + l))
      .join("\n");
  }

  const handlers = {
    info() {
      const editor = mainEditor();
      return editor ? { lang: editor.getModel().getLanguageId(), ready: true } : { lang: null, ready: false };
    },
    getCode() {
      const editor = mainEditor();
      if (!editor) throw new Error("Editor not found");
      return { code: editor.getModel().getValue(), lang: editor.getModel().getLanguageId() };
    },
    insert({ text }) {
      const editor = mainEditor();
      if (!editor) throw new Error("Editor not found");
      editor.focus();
      const selection = editor.getSelection();
      editor.pushUndoStop();
      editor.executeEdits("leetgoat", [{ range: selection, text: indentLike(editor, text), forceMoveMarkers: true }]);
      editor.pushUndoStop();
      return true;
    },
  };

  window.addEventListener("message", (e) => {
    if (e.source !== window || !e.data || e.data.__leetgoat !== "to-page") return;
    const { id, type, payload } = e.data;
    try {
      const result = handlers[type](payload || {});
      post({ type: "response", id, ok: true, result });
    } catch (err) {
      post({ type: "response", id, ok: false, error: String((err && err.message) || err) });
    }
  });
})();
