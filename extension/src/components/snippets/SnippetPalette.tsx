import { useEffect, useMemo, useRef, useState } from "react";
import { Braces, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import type { Snippet } from "../../types";
import { BUILT_IN_SNIPPETS, LANG_LABEL, snippetLang } from "../../data/snippets";
import { SNIPPETS_KEY, updateValue } from "../../lib/storage";
import { editorInfo, insertIntoEditor } from "../../lib/bridge";
import { useStorageValue } from "../../hooks/useStorage";
import { cn } from "../../lib/utils";
import { Button, IconButton } from "../ui";

const fieldClass =
  "w-full rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-sm text-fg outline-none placeholder:text-faint focus:border-accent";

function SnippetForm({ initial, defaultLang, onDone }: { initial: Snippet | null; defaultLang: string; onDone: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [lang, setLang] = useState(initial?.lang ?? defaultLang);
  const [code, setCode] = useState(initial?.code ?? "");

  const save = async () => {
    if (!title.trim() || !code.trim()) return;
    const snippet: Snippet = { id: initial?.id ?? `user:${Date.now()}`, title: title.trim(), lang, code };
    await updateValue<Snippet[]>(SNIPPETS_KEY, [], (list) =>
      initial ? list.map((s) => (s.id === initial.id ? snippet : s)) : [...list, snippet]
    );
    onDone();
  };

  return (
    <div className="space-y-2 p-3">
      <input className={fieldClass} placeholder="Title, e.g. Segment tree" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <select className={fieldClass} value={lang} onChange={(e) => setLang(e.target.value)}>
        {Object.entries(LANG_LABEL).map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
      <textarea
        className={cn(fieldClass, "lg-scroll h-48 resize-none font-mono text-xs")}
        placeholder="Paste your template…"
        value={code}
        spellCheck={false}
        onChange={(e) => setCode(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" variant="primary" onClick={save} disabled={!title.trim() || !code.trim()}>
          Save snippet
        </Button>
      </div>
    </div>
  );
}

export default function SnippetPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const custom = useStorageValue<Snippet[]>(SNIPPETS_KEY, []);
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<string | null>(null);
  const [allLangs, setAllLangs] = useState(false);
  const [active, setActive] = useState(0);
  const [editing, setEditing] = useState<Snippet | "new" | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    editorInfo()
      .then((info) => setLang(snippetLang(info.lang)))
      .catch(() => setLang(null));
    window.setTimeout(() => input.current?.focus(), 30);
  }, [open]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...custom, ...BUILT_IN_SNIPPETS].filter(
      (s) =>
        (allLangs || !lang || s.lang === lang || s.lang === "any") &&
        (!q || s.title.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
    );
  }, [custom, query, lang, allLangs]);

  if (!open) return null;
  const selected = items[Math.min(active, items.length - 1)];

  const insert = async (snippet: Snippet) => {
    try {
      await insertIntoEditor(snippet.code);
      onClose();
    } catch {
      await navigator.clipboard.writeText(snippet.code);
      setStatus("Couldn't reach the editor — copied to clipboard instead.");
    }
  };

  const remove = (snippet: Snippet) =>
    void updateValue<Snippet[]>(SNIPPETS_KEY, [], (list) => list.filter((s) => s.id !== snippet.id));

  return (
    <div
      className="fixed inset-0 z-[2147483002] flex items-start justify-center bg-black/30 pt-[12vh] backdrop-blur-[2px]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      // Keep LeetCode's own shortcuts from firing while typing here.
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="lg-pop flex h-[min(520px,76vh)] w-[min(760px,94vw)] flex-col overflow-hidden rounded-2xl border border-line bg-surface text-fg shadow-2xl">
        <div className="flex items-center gap-2 border-b border-line px-3">
          <Search className="size-4 text-faint" />
          <input
            ref={input}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, items.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter" && selected) {
                e.preventDefault();
                void insert(selected);
              } else if (e.key === "Escape") onClose();
            }}
            placeholder="Search snippets — union find, dijkstra, binary search…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
          />
          {lang && (
            <button
              type="button"
              onClick={() => setAllLangs((v) => !v)}
              className="h-6 cursor-pointer rounded-md bg-raised px-2 text-2xs font-medium text-muted hover:text-fg"
              title="Toggle filtering by the editor's language"
            >
              {allLangs ? "All languages" : LANG_LABEL[lang] ?? lang}
            </button>
          )}
          <IconButton label="Close" onClick={onClose}>
            <X />
          </IconButton>
        </div>

        {editing ? (
          <SnippetForm
            initial={editing === "new" ? null : editing}
            defaultLang={lang ?? "python"}
            onDone={() => setEditing(null)}
          />
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-[240px_1fr]">
            <ul className="lg-scroll overflow-y-auto border-r border-line p-1.5">
              {items.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => void insert(s)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm",
                      i === active ? "bg-accent-soft text-fg" : "text-muted"
                    )}
                  >
                    <Braces className={cn("size-3.5 shrink-0", s.builtIn ? "text-faint" : "text-accent")} />
                    <span className="min-w-0 flex-1 truncate">{s.title}</span>
                    {(allLangs || !lang) && <span className="text-2xs text-faint">{LANG_LABEL[s.lang] ?? s.lang}</span>}
                  </button>
                </li>
              ))}
              {!items.length && <li className="p-3 text-xs text-muted">No snippets match.</li>}
            </ul>
            <div className="flex min-h-0 flex-col">
              {selected ? (
                <>
                  <div className="flex items-center gap-2 border-b border-line px-3 py-2">
                    <span className="truncate text-sm font-semibold">{selected.title}</span>
                    <span className="text-2xs text-faint">{LANG_LABEL[selected.lang] ?? selected.lang}</span>
                    {!selected.builtIn && (
                      <div className="ml-auto flex">
                        <IconButton label="Edit" className="size-7" onClick={() => setEditing(selected)}>
                          <Pencil />
                        </IconButton>
                        <IconButton label="Delete" className="size-7 hover:text-hard" onClick={() => remove(selected)}>
                          <Trash2 />
                        </IconButton>
                      </div>
                    )}
                  </div>
                  <pre className="lg-scroll min-h-0 flex-1 overflow-auto bg-canvas p-3 font-mono text-xs leading-5">
                    {selected.code}
                  </pre>
                </>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 border-t border-line px-3 py-2 text-2xs text-faint">
          <span>↑↓ choose · Enter insert at cursor · Esc close</span>
          {status && <span className="text-medium">{status}</span>}
          {!editing && (
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setEditing("new")}>
              <Plus /> New snippet
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
