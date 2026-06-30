import type { PropsWithChildren } from "react";

interface Props extends PropsWithChildren {
  onClick?: () => void;
}

export default function IconButton({
  children,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className="
      flex
      h-10
      w-10
      items-center
      justify-center
      rounded-full

      bg-white/15

      backdrop-blur-xl

      ring-1

      ring-white/20

      transition-all

      duration-300

      hover:bg-white/25

      hover:scale-105
      "
    >
      {children}
    </button>
  );
}