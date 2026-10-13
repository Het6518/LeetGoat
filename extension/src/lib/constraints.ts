/**
 * Reads the "Constraints" block of a problem statement and turns the input
 * size into a target time complexity — the classic competitive-programming
 * rule of thumb (~10^8 simple operations per second).
 */

export interface ConstraintAnalysis {
  lines: string[];
  /** Largest input-size bound found, e.g. nums.length <= 10^5. */
  size: { name: string; value: number; raw: string } | null;
  target: { complexity: string; examples: string } | null;
  warnings: string[];
  followUp: string | null;
}

const TABLE: { max: number; complexity: string; examples: string }[] = [
  { max: 12, complexity: "O(n!)", examples: "Permutations, brute-force backtracking" },
  { max: 25, complexity: "O(2ⁿ)", examples: "Subsets, bitmask DP, backtracking" },
  { max: 100, complexity: "O(n⁴)", examples: "Small brute force, 4 nested loops" },
  { max: 500, complexity: "O(n³)", examples: "Interval DP, Floyd–Warshall" },
  { max: 5_000, complexity: "O(n²)", examples: "2D DP, all pairs, nested loops" },
  { max: 20_000, complexity: "O(n²) is risky — aim for O(n log n)", examples: "Sorting, heaps, binary search" },
  { max: 1_000_000, complexity: "O(n log n) or O(n)", examples: "Sort, heap, two pointers, hashing, sliding window" },
  { max: 100_000_000, complexity: "O(n)", examples: "Single pass, prefix sums, monotonic stack" },
  { max: Infinity, complexity: "O(log n) or O(√n)", examples: "Binary search, math, fast exponentiation" },
];

const INT_MAX = 2 ** 31 - 1;

export function htmlToText(html: string): string {
  const withPowers = html.replace(/<sup>\s*([^<]*?)\s*<\/sup>/gi, "^$1");
  const doc = new DOMParser().parseFromString(withPowers, "text/html");
  return (doc.body.textContent ?? "").replace(/\u00a0/g, " ");
}

/** Parses "10^5", "2 * 10^4", "5000", "2^31 - 1", "1e5". */
export function parseBound(raw: string): number | null {
  const s = raw
    .replace(/[,_]/g, "")
    .replace(/[−–]/g, "-")
    .replace(/[×x·]/g, "*")
    .trim();

  const sci = s.match(/^(\d+(?:\.\d+)?)e(\d+)$/i);
  if (sci) return Number(sci[1]) * 10 ** Number(sci[2]);

  const m = s.match(/^-?\s*(\d+(?:\.\d+)?)\s*(?:\*\s*(\d+)\s*\^\s*(\d+)|\^\s*(\d+))?\s*(?:([+-])\s*(\d+))?$/);
  if (!m) return null;
  const [, a, base, exp, powExp, sign, offset] = m;
  let value = Number(a);
  if (base && exp) value *= Number(base) ** Number(exp);
  else if (powExp) value = value ** Number(powExp);
  if (sign && offset) value += (sign === "+" ? 1 : -1) * Number(offset);
  return value;
}

/** 2 = input size (nums.length, n), 1 = maybe a size (k, q), 0 = a value. */
function sizeRank(name: string): number {
  const n = name.trim().toLowerCase();
  if (n.includes("[")) return 0; // element values like nums[i]
  if (/\blength\b|\.length|\bsize\b|\.size\(\)|number of|^[nm]$|^[nm]\s*,\s*[nm]$/.test(n)) return 2;
  if (/^[kqv]$/.test(n)) return 1;
  return 0;
}

export function analyzeConstraints(contentHtml: string | null): ConstraintAnalysis | null {
  if (!contentHtml) return null;
  const text = htmlToText(contentHtml);

  const start = text.search(/Constraints:/i);
  const followIdx = text.search(/Follow[\s-]?up/i);
  const end = followIdx > start ? followIdx : text.length;
  const block = start >= 0 ? text.slice(start + "Constraints:".length, end) : "";

  const lines = block
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 12);

  const sizes: (ConstraintAnalysis["size"] & {})[][] = [[], [], []];
  let largestValue = 0;

  for (const line of lines) {
    const normalized = line.replace(/≤/g, "<=").replace(/≥/g, ">=").replace(/\s<\s/g, " <= ");
    const parts = normalized.split("<=").map((p) => p.trim());
    if (parts.length < 2) continue;

    const upper = parseBound(parts[parts.length - 1].replace(/\.$/, ""));
    if (upper === null) continue;
    const name = parts.length >= 3 ? parts[parts.length - 2] : parts[0];

    const rank = sizeRank(name);
    if (rank > 0) sizes[rank].push({ name, value: upper, raw: line });
    else if (!/length|size/i.test(name)) largestValue = Math.max(largestValue, Math.abs(upper));
  }

  const candidates = sizes[2].length ? sizes[2] : sizes[1];
  const size = candidates.reduce<ConstraintAnalysis["size"]>(
    (best, c) => (!best || c.value > best.value ? c : best),
    null
  );

  const target = size ? TABLE.find((row) => size.value <= row.max) ?? null : null;

  const warnings: string[] = [];
  const lower = text.toLowerCase();
  if (/modulo\s*10\^9\s*\+\s*7|10\^9\s*\+\s*7/.test(lower)) {
    warnings.push("Answer is taken mod 10⁹+7 — apply the mod at every step, not just at the end.");
  }
  if (largestValue > INT_MAX) {
    warnings.push("Values exceed 32-bit range — use 64-bit integers (long / long long).");
  } else if (largestValue >= 1e9 && (size?.value ?? 0) >= 2) {
    warnings.push("Values reach 10⁹ — sums or products can overflow 32-bit ints.");
  } else if (largestValue >= 1e5 && (size?.value ?? 0) >= 1e5) {
    warnings.push("n × max value can pass 2³¹ — watch running sums for overflow.");
  }

  const followUp =
    followIdx >= 0
      ? text
          .slice(followIdx)
          .replace(/^Follow[\s-]?up:?\s*/i, "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 220) || null
      : null;

  return { lines, size, target, warnings, followUp };
}

/** "10^5" → "10⁵" for display. */
export function prettyPowers(s: string): string {
  const sup: Record<string, string> = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻",
  };
  return s.replace(/\^(-?\d+)/g, (_, d: string) => [...d].map((c) => sup[c] ?? c).join(""));
}
