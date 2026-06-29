import type { Problem } from "../types/problem";

const QUESTION_QUERY = `
query questionData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    title
    titleSlug
    difficulty
    topicTags {
      name
    }
  }
}
`;

interface LeetCodeResponse {
  data: {
    question: {
      title: string;
      titleSlug: string;
      difficulty: string;
      topicTags: {
        name: string;
      }[];
    };
  };
}

export async function fetchProblem(
  slug: string
): Promise<Problem> {
  const response = await fetch("https://leetcode.com/graphql/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: QUESTION_QUERY,
      variables: {
        titleSlug: slug,
      },
    }),
  });

  const data: LeetCodeResponse = await response.json();

  return {
    slug,
    title: data.data.question.title,
    difficulty: data.data.question.difficulty,
    topics: data.data.question.topicTags.map((topic) => topic.name),
  };
}