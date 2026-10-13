import { useRef, useState } from "react";
import { Download, Keyboard, Play, SlidersHorizontal, Trash2, Upload, Volume2 } from "lucide-react";
import type { Difficulty, FailSound, Settings, SoundSettings, SuccessSound } from "../../types";
import { SOUND_KEY, clearData, exportData, importData, removeValue, setValue } from "../../lib/storage";
import { previewSound } from "../../lib/sounds";
import { useStorageValue } from "../../hooks/useStorage";
import { Button, Card, DifficultyDot, Segmented, Toggle } from "../ui";

const MAX_SOUND_BYTES = 1_500_000;

function SoundRow<T extends string>({
  kind,
  label,
  value,
  options,
  sounds,
  onChange,
}: {
  kind: "success" | "fail";
  label: string;
  value: T;
  options: { value: T; label: string }[];
  sounds: SoundSettings;
  onChange: (value: T) => void;
}) {
  const file = useRef<HTMLInputElement>(null);
  const custom = useStorageValue<string | null>(SOUND_KEY(kind), null);
  const [error, setError] = useState<string | null>(null);

  const upload = (f: File) => {
    if (f.size > MAX_SOUND_BYTES) {
      setError("Keep clips under 1.5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      void setValue(SOUND_KEY(kind), reader.result);
      onChange("custom" as T);
      setError(null);
    };
    reader.readAsDataURL(f);
  };

  return (
    <div className="py-2">
      <div className="mb-1.5 text-sm font-medium">{label}</div>
      <div className="flex items-center gap-1.5">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="h-7 flex-1 cursor-pointer rounded-lg border border-line bg-canvas px-2 text-xs text-fg outline-none focus:border-accent"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
              {o.value === "custom" && !custom ? " (upload one)" : ""}
            </option>
          ))}
        </select>
        <Button size="sm" onClick={() => previewSound(kind, sounds)} aria-label={`Preview ${label}`}>
          <Play />
        </Button>
        <Button size="sm" onClick={() => file.current?.click()}>
          <Upload /> Upload
        </Button>
      </div>
      {custom && (
        <button
          type="button"
          onClick={() => {
            void removeValue(SOUND_KEY(kind));
            if (value === "custom") onChange(options[0].value);
          }}
          className="mt-1 cursor-pointer text-2xs text-faint hover:text-hard"
        >
          Remove uploaded clip
        </button>
      )}
      {error && <p className="mt-1 text-2xs text-hard">{error}</p>}
      <input
        ref={file}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function SettingsPanel({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const download = async () => {
    const backup = await exportData();
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `leetgoat-backup-${backup.exportedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const upload = async (file: File) => {
    try {
      const count = await importData(JSON.parse(await file.text()));
      setMessage(`Imported ${count} problems.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Import failed.");
    }
  };

  const reset = async () => {
    if (!window.confirm("Delete all LeetGoat data — notes, review deck, and history? This can't be undone.")) return;
    await clearData();
    setMessage("All data cleared.");
  };

  const setTarget = (d: Difficulty, minutes: number) =>
    onChange({ targets: { ...settings.targets, [d]: minutes } });
  const setSounds = (patch: Partial<SoundSettings>) => onChange({ sounds: { ...settings.sounds, ...patch } });

  return (
    <div className="space-y-3">
      <Card title="Practice" icon={<SlidersHorizontal />}>
        <div className="py-2">
          <div className="text-sm font-medium">Target time</div>
          <div className="mt-0.5 mb-2 text-xs text-muted">Minutes before the timer nudges you</div>
          <div className="grid grid-cols-3 gap-2">
            {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => (
              <label key={d} className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5">
                <DifficultyDot difficulty={d} />
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={settings.targets[d]}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v >= 1 && v <= 180) setTarget(d, v);
                  }}
                  className="w-full bg-transparent text-sm tabular-nums outline-none"
                  aria-label={`${d} target minutes`}
                />
              </label>
            ))}
          </div>
        </div>

        <Toggle
          label="Auto-start timer"
          description="Start timing as soon as you open an unsolved or due problem"
          checked={settings.autoTimer}
          onChange={(v) => onChange({ autoTimer: v })}
        />
        <Toggle
          label="Hide topic tags"
          description="Topics give away the approach — reveal them on demand"
          checked={settings.hideTopics}
          onChange={(v) => onChange({ hideTopics: v })}
        />
        <Toggle
          label="Track outside pastes"
          description="Notes when code is pasted into the editor from outside LeetCode, so your ratings stay honest"
          checked={settings.trackPastes}
          onChange={(v) => onChange({ trackPastes: v })}
        />
        <Toggle
          label="Interview mode"
          description="Blur difficulty, topic and company tags on LeetCode itself (hover to peek)"
          checked={settings.blindMode}
          onChange={(v) => onChange({ blindMode: v })}
        />

        <div className="flex items-center justify-between py-2">
          <div className="text-sm font-medium">Theme</div>
          <Segmented
            value={settings.theme}
            onChange={(theme) => onChange({ theme })}
            options={[
              { value: "auto", label: "Auto" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </div>
      </Card>

      <Card title="Sounds" icon={<Volume2 />}>
        <Toggle
          label="Play verdict sounds"
          description="A victory jingle on Accepted, a dramatic groan on anything else"
          checked={settings.sounds.enabled}
          onChange={(v) => setSounds({ enabled: v })}
        />
        <label className="flex items-center gap-3 py-2">
          <span className="text-sm font-medium">Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.sounds.volume}
            onChange={(e) => setSounds({ volume: Number(e.target.value) })}
            className="flex-1 accent-[var(--lg-accent)]"
          />
        </label>
        <SoundRow<SuccessSound>
          kind="success"
          label="On Accepted"
          value={settings.sounds.success}
          sounds={settings.sounds}
          onChange={(success) => setSounds({ success })}
          options={[
            { value: "mission", label: "Mission complete (fanfare)" },
            { value: "chime", label: "Chime" },
            { value: "custom", label: "My uploaded clip" },
            { value: "none", label: "Silent" },
          ]}
        />
        <SoundRow<FailSound>
          kind="fail"
          label="On Wrong Answer / TLE / Error"
          value={settings.sounds.fail}
          sounds={settings.sounds}
          onChange={(fail) => setSounds({ fail })}
          options={[
            { value: "faah", label: "Faaah" },
            { value: "buzzer", label: "Buzzer" },
            { value: "custom", label: "My uploaded clip" },
            { value: "none", label: "Silent" },
          ]}
        />
        <p className="text-2xs text-faint">Upload any short audio file you own — it plays instead of the built-in sound.</p>
      </Card>

      <Card title="Shortcuts" icon={<Keyboard />}>
        <p className="text-xs text-muted">
          Toggle the sidebar with{" "}
          <kbd className="rounded border border-line bg-raised px-1.5 py-0.5 font-mono text-2xs text-fg">Alt</kbd> +{" "}
          <kbd className="rounded border border-line bg-raised px-1.5 py-0.5 font-mono text-2xs text-fg">G</kbd>, open snippets
          with{" "}
          <kbd className="rounded border border-line bg-raised px-1.5 py-0.5 font-mono text-2xs text-fg">Alt</kbd> +{" "}
          <kbd className="rounded border border-line bg-raised px-1.5 py-0.5 font-mono text-2xs text-fg">S</kbd>. Change them at
          chrome://extensions/shortcuts.
        </p>
      </Card>

      <Card title="Your data" icon={<Download />}>
        <p className="mb-3 text-xs text-muted">
          Everything stays in your browser. Export a backup to move it between machines.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={download}>
            <Download /> Export
          </Button>
          <Button size="sm" onClick={() => fileInput.current?.click()}>
            <Upload /> Import
          </Button>
          <Button size="sm" variant="ghost" className="text-hard hover:text-hard" onClick={reset}>
            <Trash2 /> Reset
          </Button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
        {message && <p className="mt-2 text-xs text-muted">{message}</p>}
      </Card>
    </div>
  );
}
