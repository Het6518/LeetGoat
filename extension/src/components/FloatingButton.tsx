import type { FC } from "react";

interface FloatingButtonProps {
  onClick: () => void;
}

const FloatingButton: FC<FloatingButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "56px",
        height: "56px",
        borderRadius: "999px",
        border: "none",
        cursor: "pointer",
        background: "#111827",
        color: "white",
        fontSize: "24px",
        zIndex: 999999,
        boxShadow: "0 8px 20px rgba(0,0,0,.25)",
      }}
    >
      🐐
    </button>
  );
};

export default FloatingButton;