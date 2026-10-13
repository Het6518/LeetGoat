import type { ProblemRecord } from "../types";

export function dueRecords(records: ProblemRecord[], now = Date.now()) {
  return records
    .filter((r) => r.review && r.review.due <= now)
    .sort((a, b) => a.review!.due - b.review!.due);
}
