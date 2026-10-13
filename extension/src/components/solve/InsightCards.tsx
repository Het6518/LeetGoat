import { useMemo } from "react";
import { ArrowUpRight, CircleCheck, Gauge, Lightbulb, Lock, Route, TriangleAlert } from "lucide-react";
import type { Problem, ProblemRecord } from "../../types";
import { analyzeConstraints, prettyPowers } from "../../lib/constraints";
import { problemUrl } from "../../api/leetcode";
import { Button, Card, DifficultyDot } from "../ui";

export function ConstraintsCard({ problem }: { problem: Problem }) {
  const analysis = useMemo(() => analyzeConstraints(problem.content), [problem.content]);

  if (!analysis || (!analysis.target && !analysis.warnings.length && !analysis.lines.length)) return null;

  return (
    <Card title="Complexity budget" icon={<Gauge />}>
      {analysis.target && analysis.size ? (
        <>
          <div className="text-lg font-semibold text-accent">{analysis.target.complexity}</div>
          <div className="mt-0.5 text-xs text-muted">
            because <span className="font-mono text-fg">{prettyPowers(analysis.size.raw)}</span>
          </div>
          <div className="mt-2 text-xs text-muted">
            <span className="text-faint">Fits: </span>
            {analysis.target.examples}
          </div>
        </>
      ) : (
        <div className="text-xs text-muted">Couldn't find an input-size bound in the constraints.</div>
      )}

      {analysis.warnings.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {analysis.warnings.map((w) => (
            <li key={w} className="flex gap-2 rounded-lg bg-medium/10 px-2.5 py-2 text-xs text-fg">
              <TriangleAlert className="mt-px size-3.5 shrink-0 text-medium" />
              {w}
            </li>
          ))}
        </ul>
      )}

      {analysis.followUp && (
        <div className="mt-3 flex gap-2 rounded-lg bg-raised px-2.5 py-2 text-xs">
          <Route className="mt-px size-3.5 shrink-0 text-faint" />
          <span>
            <span className="font-medium">Follow-up: </span>
            <span className="text-muted">{prettyPowers(analysis.followUp)}</span>
          </span>
        </div>
      )}

      {analysis.lines.length > 0 && (
        <details className="group mt-3">
          <summary className="cursor-pointer text-xs text-faint select-none hover:text-muted">
            All constraints ({analysis.lines.length})
          </summary>
          <ul className="mt-2 space-y-1 font-mono text-xs text-muted">
            {analysis.lines.map((line) => (
              <li key={line}>{prettyPowers(line)}</li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}

/** Strips anything executable from LeetCode-authored hint HTML. */
function sanitize(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, iframe, object, embed, img").forEach((el) => el.remove());
  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of [...el.attributes]) {
      if (attr.name.startsWith("on") || attr.name === "href" || attr.name === "src") el.removeAttribute(attr.name);
    }
  });
  return doc.body.innerHTML;
}

export function HintsCard({
  hints,
  revealed,
  onReveal,
}: {
  hints: string[];
  revealed: number;
  onReveal: (index: number) => void;
}) {
  const clean = useMemo(() => hints.map(sanitize), [hints]);
  if (!hints.length) return null;

  return (
    <Card
      title="Hints"
      icon={<Lightbulb />}
      action={
        <span className="text-xs text-faint">
          {Math.min(revealed, hints.length)} / {hints.length}
        </span>
      }
    >
      <ol className="space-y-2">
        {clean.slice(0, revealed).map((html, i) => (
          <li key={i} className="lg-pop flex gap-2.5 text-sm">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-raised font-mono text-2xs text-muted">
              {i + 1}
            </span>
            <div className="lg-prose min-w-0 text-fg" dangerouslySetInnerHTML={{ __html: html }} />
          </li>
        ))}
      </ol>
      {revealed < hints.length && (
        <Button className={revealed > 0 ? "mt-3" : ""} onClick={() => onReveal(revealed)}>
          <Lightbulb />
          Reveal hint {revealed + 1}
        </Button>
      )}
      <p className="mt-2 text-2xs text-faint">One at a time — used hints count toward your rating suggestion.</p>
    </Card>
  );
}

export function SimilarCard({
  similar,
  records,
}: {
  similar: Problem["similar"];
  records: Map<string, ProblemRecord>;
}) {
  if (!similar.length) return null;
  const solvedCount = similar.filter((s) => records.get(s.slug)?.solvedAt).length;

  return (
    <Card
      title="Similar problems"
      icon={<Route />}
      action={
        <span className="text-xs text-faint">
          {solvedCount} / {similar.length} done
        </span>
      }
    >
      <ul className="-mx-2">
        {similar.map((s) => {
          const solved = !!records.get(s.slug)?.solvedAt;
          return (
            <li key={s.slug}>
              <a
                href={problemUrl(s.slug)}
                className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-raised"
              >
                <DifficultyDot difficulty={s.difficulty} />
                <span className="min-w-0 flex-1 truncate">{s.title}</span>
                {s.isPaidOnly && <Lock className="size-3 text-faint" />}
                {solved ? (
                  <CircleCheck className="size-3.5 text-easy" />
                ) : (
                  <ArrowUpRight className="size-3.5 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
