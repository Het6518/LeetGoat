import type { PropsWithChildren } from "react";
import { cn } from "../../lib/utils";

interface CardProps extends PropsWithChildren {
  className?: string;
}

export default function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200 bg-white p-5 shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
}