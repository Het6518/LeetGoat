import Badge from "../ui/Badge";
import TopicChip from "../ui/TopicChip";
import type { Problem } from "../../types/problem";

interface Props {
  problem: Problem | null;
}

export default function ProblemCard({
  problem,
}: Props) {
  if (!problem) {
    return <p>Loading...</p>;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div>
        <p
          style={{
            fontSize: "12px",
            color: "#888",
          }}
        >
          Current Problem
        </p>

        <h2>{problem.title}</h2>
      </div>

      <Badge difficulty={problem.difficulty} />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        {problem.topics.map((topic) => (
          <TopicChip
            key={topic}
            topic={topic}
          />
        ))}
      </div>
    </div>
  );
}