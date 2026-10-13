import { useEffect, useRef } from "react";
import { cn } from "../lib/utils";

export interface Banner {
  id: number;
  accepted: boolean;
  /** LeetCode's status, e.g. "Wrong Answer" or "Time Limit Exceeded". */
  detail: string;
}

const SHOW_MS = 2600;

/** Big full-screen verdict flash, shown with the verdict sound. Click-through. */
export default function VerdictBanner({ banner, onDone }: { banner: Banner; onDone: () => void }) {
  // The parent re-renders every second (timer); keep the timeout stable.
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    const id = window.setTimeout(() => done.current(), SHOW_MS);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[2147483003] grid place-items-center">
      <div
        className={cn(
          "lg-verdict rounded-3xl border-2 bg-black/75 px-14 py-8 text-center shadow-2xl backdrop-blur-md",
          banner.accepted ? "border-easy shadow-easy/30" : "border-hard shadow-hard/30"
        )}
      >
        <div
          className={cn(
            "text-[64px] leading-none font-black tracking-tight uppercase",
            banner.accepted ? "text-easy" : "text-hard"
          )}
          style={{ textShadow: `0 0 32px ${banner.accepted ? "rgb(0 166 147 / 0.6)" : "rgb(229 72 77 / 0.6)"}` }}
        >
          {banner.accepted ? "Accepted" : "Rejected"}
        </div>
        <div className={cn("mt-3 text-2xl font-bold", banner.accepted ? "text-easy" : "text-hard")}>
          {banner.accepted ? "Well done! 🎉" : banner.detail}
        </div>
      </div>
    </div>
  );
}
