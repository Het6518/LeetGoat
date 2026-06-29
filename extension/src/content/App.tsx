
import FloatingButton from "../components/FloatingButton";
import Sidebar from "../components/Sidebar";
import { useEffect, useState } from "react";
import { getProblemSlug } from "../lib/getProblemSlug";
import { fetchProblem } from "../api/leetcode";
import type { Problem } from "../types/problem";
export default function App() {
  const [open, setOpen] = useState(false);
const [problem, setProblem] = useState<Problem | null>(null);
useEffect(() => {
  async function loadProblem() {
    const slug = getProblemSlug();

    if (!slug) return;

    const problem = await fetchProblem(slug);

    console.log(problem);

    setProblem(problem);
  }

  loadProblem();
}, []);
  return (
    <>
      <FloatingButton
        onClick={() => setOpen(!open)}
      />

   <Sidebar
    open={open}
    problem={problem}
/>

    </>
  );
}