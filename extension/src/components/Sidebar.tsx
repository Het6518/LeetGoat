import type { FC } from "react";
import type {Problem} from "../types/problem"
interface SidebarProps {
    open: boolean;
    problem: Problem | null;
}

const Sidebar: FC<SidebarProps> = ({ open, problem }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: open ? 0 : "-380px",
        width: "380px",
        height: "100vh",
        background: "white",
        transition: "right .3s ease",
        zIndex: 999998,
        boxShadow: "-6px 0 18px rgba(0,0,0,.15)",
      }}
    >
      <h1
        style={{
          padding: "24px",
          fontSize: "24px",
          fontWeight: 700,
        }}
      >
        🐐 LeetGoat
      </h1>
    
   <div style={{ padding: "24px" }}>
  <p
    style={{
      fontSize: "12px",
      color: "#888",
      marginBottom: "8px",
    }}
  >
    Current Problem
  </p>

  <h2>{problem?.title}</h2>

  <p>{problem?.difficulty}</p>

  <div>
    {problem?.topics.map((topic) => (
      <span key={topic}>
        {topic} + " "
      </span>
    ))}
  </div>
</div>
    </div>
  );
};

export default Sidebar;