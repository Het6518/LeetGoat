import { useEffect, useState } from "react";
import { ChevronDown, ClipboardPaste, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import {
  PASTE_FLAG_CHARS,
  formatGap,
  scanAccount,
  type AccountReport,
  type ContestReport,
  type ProblemReplay,
  type ProblemVerdict,
} from "../../lib/contest";
import { formatDate } from "../../lib/dates";
import { cn } from "../../lib/utils";
import { Button, Card, ProgressBar, Segmented } from "../ui";

/** Last dock request already handled — survives the panel remounting. */
let handledToken = 0;

const VERDICT_STYLE: Record<ProblemVerdict, { label: string; badge: string; cell: string }> = {
  pasted: { label: "External paste", badge: "bg-hard text-white", cell: "bg-hard" },
  snippet: { label: "Small paste", badge: "bg-medium/12 text-medium", cell: "bg-medium" },
  clean: { label: "Typed", badge: "bg-easy/12 text-easy", cell: "bg-easy/70" },
  nodata: { label: "No replay", badge: "bg-raised text-faint", cell: "bg-raised" },
};

function ProblemRow({ problem }: { problem: ProblemReplay }) {
  const [show, setShow] = useState(false);
  const style = VERDICT_STYLE[problem.verdict];
  const biggest = problem.pastes.reduce<ProblemReplay["pastes"][number] | null>(
    (m, p) => (!m || p.chars > m.chars ? p : m),
    null
  );

  return (
    <li className="border-t border-line py-2 first:border-t-0">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-xs font-medium">{problem.title}</span>
        <span className={cn("rounded px-1.5 py-0.5 text-2xs font-semibold", style.badge)}>{style.label}</span>
      </div>
      {problem.verdict !== "nodata" && (
        <div className="mt-0.5 text-2xs text-muted">
          {problem.pastes.length > 0 && (
            <>
              {problem.pastes.length} paste{problem.pastes.length === 1 ? "" : "s"}, largest {problem.largestPaste} chars
              {problem.pasteToSubmitSec !== null && ` · submitted ${formatGap(problem.pasteToSubmitSec)} later`}
              {" · "}
            </>
          )}
          {problem.edits} typing events
          {problem.submittedAt !== null && (problem.accepted ? " · accepted" : " · submitted")}
        </div>
      )}
      {biggest && biggest.chars > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="mt-1 inline-flex cursor-pointer items-center gap-1 text-2xs text-accent hover:underline"
          >
            <ClipboardPaste className="size-3" />
            {show ? "Hide" : "Show"} what was pasted
          </button>
          {show && (
            <pre className="lg-scroll mt-1 max-h-56 overflow-auto rounded-md bg-raised p-2 font-mono text-2xs leading-4 whitespace-pre">
              {biggest.text}
            </pre>
          )}
        </>
      )}
    </li>
  );
}

function ContestRow({ contest }: { contest: ContestReport }) {
  const [open, setOpen] = useState(contest.verdict === "pasted");
  const style = VERDICT_STYLE[contest.verdict];
  const pasted = contest.problems.filter((p) => p.verdict === "pasted").length;

  return (
    <li className={cn("rounded-lg border bg-surface", contest.verdict === "pasted" ? "border-hard/40" : "border-line")}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{contest.title}</div>
          <div className="text-2xs text-faint">
            {formatDate(contest.startTime * 1000)} · {contest.solved}/{contest.total} solved
            {contest.ratingDelta !== null && (
              <span className={contest.ratingDelta >= 0 ? "text-easy" : "text-hard"}>
                {" "}
                {contest.ratingDelta >= 0 ? "+" : ""}
                {contest.ratingDelta}
              </span>
            )}
          </div>
        </div>
        <span className={cn("rounded px-1.5 py-0.5 text-2xs font-semibold", style.badge)}>
          {contest.verdict === "pasted" ? `${pasted} pasted` : style.label}
        </span>
        <ChevronDown className={cn("size-3.5 text-faint transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="border-t border-line px-3 py-1">
          {contest.problems.length ? (
            contest.problems.map((p) => <ProblemRow key={p.slug} problem={p} />)
          ) : (
            <li className="py-2 text-xs text-muted">Couldn't load this contest.</li>
          )}
        </ul>
      )}
    </li>
  );
}

export default function AccountPanel({ defaultUser, runToken }: { defaultUser: string | null; runToken?: number }) {
  const [user, setUser] = useState(defaultUser ?? "");
  const [limit, setLimit] = useState<"10" | "25" | "50">("25");
  const [progress, setProgress] = useState<{ label: string; done: number; total: number } | null>(null);
  const [report, setReport] = useState<AccountReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (username = user) => {
    const slug = username.trim().replace(/^@/, "");
    if (!slug || progress) return;
    setError(null);
    setReport(null);
    try {
      setReport(await scanAccount(slug, Number(limit), (label, done, total) => setProgress({ label, done, total })));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setProgress(null);
    }
  };

  // Opened from the dock on a profile page: check that account right away.
  useEffect(() => {
    if (!runToken || runToken === handledToken || !defaultUser) return;
    // Deferred so the scan starts after mount rather than inside the effect.
    const id = window.setTimeout(() => {
      handledToken = runToken;
      void run(defaultUser);
    }, 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runToken, defaultUser]);

  const icon =
    report?.verdict === "cheater" ? (
      <ShieldAlert className="size-5 text-hard" />
    ) : report?.verdict === "clean" ? (
      <ShieldCheck className="size-5 text-easy" />
    ) : (
      <ShieldQuestion className="size-5 text-faint" />
    );

  return (
    <div className="space-y-3">
      <Card title="Account cheat check" icon={<ShieldAlert />}>
        <p className="mb-3 text-xs text-muted">
          Reads LeetCode's own Code Replay for every contest this account took and flags problems where more than{" "}
          {PASTE_FLAG_CHARS} characters were pasted into the editor from outside LeetCode.
        </p>
        <input
          value={user}
          onChange={(e) => setUser(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void run()}
          placeholder="LeetCode username (open a profile to prefill)"
          className="h-8 w-full rounded-lg border border-line bg-canvas px-2.5 font-mono text-xs outline-none focus:border-accent"
        />
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted">
            Last
            <Segmented
              value={limit}
              onChange={setLimit}
              options={[
                { value: "10", label: "10" },
                { value: "25", label: "25" },
                { value: "50", label: "50" },
              ]}
            />
            contests
          </div>
          <Button variant="primary" size="sm" onClick={() => void run()} disabled={!!progress || !user.trim()}>
            <ShieldAlert /> {progress ? "Checking…" : "Check"}
          </Button>
        </div>
        {progress && (
          <div className="mt-3">
            <ProgressBar value={progress.total ? progress.done / progress.total : 0} />
            <div className="mt-1 text-2xs text-faint">
              {progress.label} {progress.total > 1 && `${progress.done}/${progress.total}`}
            </div>
          </div>
        )}
        {error && <p className="mt-2 text-xs text-hard">{error}</p>}
      </Card>

      {report && (
        <Card
          className={cn(
            report.verdict === "cheater" && "border-hard/50 bg-hard/5",
            report.verdict === "clean" && "border-easy/50 bg-easy/5"
          )}
        >
          <div className="flex items-start gap-3">
            {icon}
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "text-base font-semibold",
                  report.verdict === "cheater" && "text-hard",
                  report.verdict === "clean" && "text-easy"
                )}
              >
                {report.verdict === "cheater"
                  ? "Likely a cheater"
                  : report.verdict === "clean"
                    ? "Not a cheater"
                    : "Nothing to check"}
              </div>
              <div className="text-xs text-muted">
                {report.username} · {report.summary}
              </div>
            </div>
          </div>
          {report.contests.length > 1 && (
            <div className="mt-3">
              <div className="flex gap-[3px]">
                {[...report.contests].reverse().map((c) => (
                  <div
                    key={c.slug}
                    title={`${c.title}: ${VERDICT_STYLE[c.verdict].label}`}
                    className={cn("h-5 min-w-1 flex-1 rounded-sm", VERDICT_STYLE[c.verdict].cell)}
                  />
                ))}
              </div>
              <div className="mt-1 flex justify-between text-2xs text-faint">
                <span>older</span>
                <span>newer</span>
              </div>
            </div>
          )}
        </Card>
      )}

      {report && report.contests.length > 0 && (
        <ul className="space-y-1.5">
          {report.contests.map((c) => (
            <ContestRow key={c.slug} contest={c} />
          ))}
        </ul>
      )}
    </div>
  );
}
