import { useEffect, useState } from "react";
import FloatingButton from "../components/FloatingButton";
import Sidebar from "../components/layout/Sidebar";
import { fetchProblem } from "../api/leetcode";
import { getProblemSlug } from "../lib/getProblemSlug";
import type { Problem } from "../types/problem";

export default function App() {
  const [open, setOpen] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  useEffect(() => {
    async function loadProblem() {
      const slug = getProblemSlug();
      if (!slug) return;

      try {
        const data = await fetchProblem(slug);
        setProblem(data);
      } catch (error) {
        console.error("Failed to fetch problem:", error);
      }
    }

    loadProblem();
  }, []);

  return (
    <>
      <FloatingButton onClick={() => setOpen((prev) => !prev)} />
      <Sidebar open={open} problem={problem} />
    </>
  );
}