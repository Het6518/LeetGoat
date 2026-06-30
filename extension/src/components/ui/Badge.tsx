interface BadgeProps {
  difficulty: string;
}

const colors = {
  Easy: "#16a34a",
  Medium: "#ca8a04",
  Hard: "#dc2626",
};

export default function Badge({ difficulty }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        padding: "6px 12px",
        borderRadius: "999px",
        background: `${colors[difficulty as keyof typeof colors]}20`,
        color: colors[difficulty as keyof typeof colors] ?? "#888",
        fontWeight: 600,
        fontSize: "12px",
      }}
    >
      {difficulty}
    </span>
  );
}