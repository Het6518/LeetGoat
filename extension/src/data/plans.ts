/**
 * Curated interview study plans. Only slugs + grouping live here; titles,
 * difficulty and your LeetCode status are fetched (and cached) at runtime.
 */
export interface PlanSection {
  name: string;
  slugs: string[];
}

export type PlanId = "grind75" | "neetcode150" | "blind75";

export interface StudyPlan {
  id: PlanId;
  name: string;
  blurb: string;
  sections: PlanSection[];
}

const s = (name: string, list: string): PlanSection => ({ name, slugs: list.trim().split(/\s+/) });

export const PLANS: StudyPlan[] = [
  {
    id: "grind75",
    name: "Grind 75",
    blurb: "8-week interview plan, easiest first",
    sections: [
      s("Week 1", `two-sum valid-parentheses merge-two-sorted-lists best-time-to-buy-and-sell-stock valid-palindrome
        invert-binary-tree valid-anagram binary-search flood-fill lowest-common-ancestor-of-a-binary-search-tree
        balanced-binary-tree linked-list-cycle implement-queue-using-stacks`),
      s("Week 2", `first-bad-version ransom-note climbing-stairs longest-palindrome reverse-linked-list majority-element
        add-binary diameter-of-binary-tree middle-of-the-linked-list maximum-depth-of-binary-tree contains-duplicate
        maximum-subarray`),
      s("Week 3", `insert-interval 01-matrix k-closest-points-to-origin longest-substring-without-repeating-characters
        3sum binary-tree-level-order-traversal clone-graph evaluate-reverse-polish-notation`),
      s("Week 4", `course-schedule implement-trie-prefix-tree coin-change product-of-array-except-self min-stack
        validate-binary-search-tree number-of-islands rotting-oranges`),
      s("Week 5", `search-in-rotated-sorted-array combination-sum permutations merge-intervals
        lowest-common-ancestor-of-a-binary-tree time-based-key-value-store accounts-merge sort-colors`),
      s("Week 6", `word-break partition-equal-subset-sum string-to-integer-atoi spiral-matrix subsets
        binary-tree-right-side-view longest-palindromic-substring unique-paths
        construct-binary-tree-from-preorder-and-inorder-traversal`),
      s("Week 7", `container-with-most-water letter-combinations-of-a-phone-number word-search
        find-all-anagrams-in-a-string minimum-height-trees task-scheduler lru-cache`),
      s("Week 8", `kth-smallest-element-in-a-bst minimum-window-substring serialize-and-deserialize-binary-tree
        trapping-rain-water find-median-from-data-stream word-ladder basic-calculator
        maximum-profit-in-job-scheduling merge-k-sorted-lists largest-rectangle-in-histogram`),
    ],
  },
  {
    id: "neetcode150",
    name: "NeetCode 150",
    blurb: "Every core pattern, grouped by topic",
    sections: [
      s("Arrays & Hashing", `contains-duplicate valid-anagram two-sum group-anagrams top-k-frequent-elements
        encode-and-decode-strings product-of-array-except-self valid-sudoku longest-consecutive-sequence`),
      s("Two Pointers", `valid-palindrome two-sum-ii-input-array-is-sorted 3sum container-with-most-water trapping-rain-water`),
      s("Sliding Window", `best-time-to-buy-and-sell-stock longest-substring-without-repeating-characters
        longest-repeating-character-replacement permutation-in-string minimum-window-substring sliding-window-maximum`),
      s("Stack", `valid-parentheses min-stack evaluate-reverse-polish-notation generate-parentheses daily-temperatures
        car-fleet largest-rectangle-in-histogram`),
      s("Binary Search", `binary-search search-a-2d-matrix koko-eating-bananas find-minimum-in-rotated-sorted-array
        search-in-rotated-sorted-array time-based-key-value-store median-of-two-sorted-arrays`),
      s("Linked List", `reverse-linked-list merge-two-sorted-lists linked-list-cycle reorder-list
        remove-nth-node-from-end-of-list copy-list-with-random-pointer add-two-numbers find-the-duplicate-number
        lru-cache merge-k-sorted-lists reverse-nodes-in-k-group`),
      s("Trees", `invert-binary-tree maximum-depth-of-binary-tree diameter-of-binary-tree balanced-binary-tree same-tree
        subtree-of-another-tree lowest-common-ancestor-of-a-binary-search-tree binary-tree-level-order-traversal
        binary-tree-right-side-view count-good-nodes-in-binary-tree validate-binary-search-tree
        kth-smallest-element-in-a-bst construct-binary-tree-from-preorder-and-inorder-traversal
        binary-tree-maximum-path-sum serialize-and-deserialize-binary-tree`),
      s("Tries", `implement-trie-prefix-tree design-add-and-search-words-data-structure word-search-ii`),
      s("Heap / Priority Queue", `kth-largest-element-in-a-stream last-stone-weight k-closest-points-to-origin
        kth-largest-element-in-an-array task-scheduler design-twitter find-median-from-data-stream`),
      s("Backtracking", `subsets combination-sum combination-sum-ii permutations subsets-ii word-search
        palindrome-partitioning letter-combinations-of-a-phone-number n-queens`),
      s("Graphs", `number-of-islands max-area-of-island clone-graph walls-and-gates rotting-oranges
        pacific-atlantic-water-flow surrounded-regions course-schedule course-schedule-ii graph-valid-tree
        number-of-connected-components-in-an-undirected-graph redundant-connection word-ladder`),
      s("Advanced Graphs", `reconstruct-itinerary min-cost-to-connect-all-points network-delay-time swim-in-rising-water
        alien-dictionary cheapest-flights-within-k-stops`),
      s("1-D Dynamic Programming", `climbing-stairs min-cost-climbing-stairs house-robber house-robber-ii
        longest-palindromic-substring palindromic-substrings decode-ways coin-change maximum-product-subarray
        word-break longest-increasing-subsequence partition-equal-subset-sum`),
      s("2-D Dynamic Programming", `unique-paths longest-common-subsequence best-time-to-buy-and-sell-stock-with-cooldown
        coin-change-ii target-sum interleaving-string longest-increasing-path-in-a-matrix distinct-subsequences
        edit-distance burst-balloons regular-expression-matching`),
      s("Greedy", `maximum-subarray jump-game jump-game-ii gas-station hand-of-straights
        merge-triplets-to-form-target-triplet partition-labels valid-parenthesis-string`),
      s("Intervals", `insert-interval merge-intervals non-overlapping-intervals meeting-rooms meeting-rooms-ii
        minimum-interval-to-include-each-query`),
      s("Math & Geometry", `rotate-image spiral-matrix set-matrix-zeroes happy-number plus-one powx-n multiply-strings
        detect-squares`),
      s("Bit Manipulation", `single-number number-of-1-bits counting-bits reverse-bits missing-number sum-of-two-integers
        reverse-integer`),
    ],
  },
  {
    id: "blind75",
    name: "Blind 75",
    blurb: "The classic minimal interview list",
    sections: [
      s("Array", `two-sum best-time-to-buy-and-sell-stock contains-duplicate product-of-array-except-self maximum-subarray
        maximum-product-subarray find-minimum-in-rotated-sorted-array search-in-rotated-sorted-array 3sum
        container-with-most-water`),
      s("Binary", `sum-of-two-integers number-of-1-bits counting-bits missing-number reverse-bits`),
      s("Dynamic Programming", `climbing-stairs coin-change longest-increasing-subsequence longest-common-subsequence
        word-break combination-sum-iv house-robber house-robber-ii decode-ways unique-paths jump-game`),
      s("Graph", `clone-graph course-schedule pacific-atlantic-water-flow number-of-islands longest-consecutive-sequence
        alien-dictionary graph-valid-tree number-of-connected-components-in-an-undirected-graph`),
      s("Interval", `insert-interval merge-intervals non-overlapping-intervals meeting-rooms meeting-rooms-ii`),
      s("Linked List", `reverse-linked-list linked-list-cycle merge-two-sorted-lists merge-k-sorted-lists
        remove-nth-node-from-end-of-list reorder-list`),
      s("Matrix", `set-matrix-zeroes spiral-matrix rotate-image word-search`),
      s("String", `longest-substring-without-repeating-characters longest-repeating-character-replacement
        minimum-window-substring valid-anagram group-anagrams valid-parentheses valid-palindrome
        longest-palindromic-substring palindromic-substrings encode-and-decode-strings`),
      s("Tree", `maximum-depth-of-binary-tree same-tree invert-binary-tree binary-tree-maximum-path-sum
        binary-tree-level-order-traversal serialize-and-deserialize-binary-tree subtree-of-another-tree
        construct-binary-tree-from-preorder-and-inorder-traversal validate-binary-search-tree
        kth-smallest-element-in-a-bst lowest-common-ancestor-of-a-binary-search-tree implement-trie-prefix-tree
        design-add-and-search-words-data-structure word-search-ii`),
      s("Heap", `top-k-frequent-elements find-median-from-data-stream`),
    ],
  },
];

export function planSlugs(plan: StudyPlan): string[] {
  return plan.sections.flatMap((section) => section.slugs);
}

export function getPlan(id: PlanId): StudyPlan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}
