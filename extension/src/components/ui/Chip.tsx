interface TopicChipProps {
  topic: string;
}

export default function TopicChip({
  topic,
}: TopicChipProps) {
  return (
    <span
      style={{
        padding: "6px 12px",
        background: "#f3f4f6",
        borderRadius: "999px",
        fontSize: "12px",
      }}
    >
      {topic} 
    </span>
  );
}