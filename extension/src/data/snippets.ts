import type { Snippet } from "../types";

/** Built-in templates for the patterns interviews lean on most. Langs are Monaco language ids. */
type Template = { id: string; title: string; python: string; cpp: string; java: string };

const TEMPLATES: Template[] = [
  {
    id: "binary-search",
    title: "Binary search (first true)",
    python: `lo, hi = 0, len(nums)  # search space [lo, hi)
while lo < hi:
    mid = (lo + hi) // 2
    if condition(mid):
        hi = mid
    else:
        lo = mid + 1
# lo = first index where condition is true (len(nums) if none)`,
    cpp: `int lo = 0, hi = nums.size();  // search space [lo, hi)
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (condition(mid)) hi = mid;
    else lo = mid + 1;
}
// lo = first index where condition is true (n if none)`,
    java: `int lo = 0, hi = nums.length;  // search space [lo, hi)
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (condition(mid)) hi = mid;
    else lo = mid + 1;
}
// lo = first index where condition is true (n if none)`,
  },
  {
    id: "sliding-window",
    title: "Sliding window (variable size)",
    python: `from collections import defaultdict

count = defaultdict(int)
left = best = 0
for right, ch in enumerate(s):
    count[ch] += 1
    while window_invalid(count):
        count[s[left]] -= 1
        left += 1
    best = max(best, right - left + 1)`,
    cpp: `unordered_map<char, int> count;
int left = 0, best = 0;
for (int right = 0; right < (int)s.size(); right++) {
    count[s[right]]++;
    while (windowInvalid(count)) {
        count[s[left]]--;
        left++;
    }
    best = max(best, right - left + 1);
}`,
    java: `Map<Character, Integer> count = new HashMap<>();
int left = 0, best = 0;
for (int right = 0; right < s.length(); right++) {
    count.merge(s.charAt(right), 1, Integer::sum);
    while (windowInvalid(count)) {
        count.merge(s.charAt(left), -1, Integer::sum);
        left++;
    }
    best = Math.max(best, right - left + 1);
}`,
  },
  {
    id: "union-find",
    title: "Union-Find (DSU)",
    python: `parent = list(range(n))
size = [1] * n

def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]  # path halving
        x = parent[x]
    return x

def union(a, b):
    ra, rb = find(a), find(b)
    if ra == rb:
        return False
    if size[ra] < size[rb]:
        ra, rb = rb, ra
    parent[rb] = ra
    size[ra] += size[rb]
    return True`,
    cpp: `struct DSU {
    vector<int> parent, sz;
    DSU(int n) : parent(n), sz(n, 1) { iota(parent.begin(), parent.end(), 0); }
    int find(int x) {
        while (parent[x] != x) x = parent[x] = parent[parent[x]];
        return x;
    }
    bool unite(int a, int b) {
        a = find(a), b = find(b);
        if (a == b) return false;
        if (sz[a] < sz[b]) swap(a, b);
        parent[b] = a;
        sz[a] += sz[b];
        return true;
    }
};`,
    java: `class DSU {
    int[] parent, size;
    DSU(int n) {
        parent = new int[n];
        size = new int[n];
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
    }
    int find(int x) {
        while (parent[x] != x) x = parent[x] = parent[parent[x]];
        return x;
    }
    boolean union(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return false;
        if (size[a] < size[b]) { int t = a; a = b; b = t; }
        parent[b] = a;
        size[a] += size[b];
        return true;
    }
}`,
  },
  {
    id: "bfs-grid",
    title: "BFS on a grid",
    python: `from collections import deque

rows, cols = len(grid), len(grid[0])
queue = deque([(sr, sc)])
seen = {(sr, sc)}
steps = 0
while queue:
    for _ in range(len(queue)):
        r, c = queue.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in seen and grid[nr][nc] != WALL:
                seen.add((nr, nc))
                queue.append((nr, nc))
    steps += 1`,
    cpp: `int rows = grid.size(), cols = grid[0].size();
vector<vector<bool>> seen(rows, vector<bool>(cols, false));
queue<pair<int, int>> q;
q.push({sr, sc});
seen[sr][sc] = true;
int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
int steps = 0;
while (!q.empty()) {
    for (int k = q.size(); k > 0; k--) {
        auto [r, c] = q.front();
        q.pop();
        for (auto& d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || seen[nr][nc]) continue;
            seen[nr][nc] = true;
            q.push({nr, nc});
        }
    }
    steps++;
}`,
    java: `int rows = grid.length, cols = grid[0].length;
boolean[][] seen = new boolean[rows][cols];
Deque<int[]> queue = new ArrayDeque<>();
queue.add(new int[]{sr, sc});
seen[sr][sc] = true;
int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
int steps = 0;
while (!queue.isEmpty()) {
    for (int k = queue.size(); k > 0; k--) {
        int[] cell = queue.poll();
        for (int[] d : dirs) {
            int nr = cell[0] + d[0], nc = cell[1] + d[1];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || seen[nr][nc]) continue;
            seen[nr][nc] = true;
            queue.add(new int[]{nr, nc});
        }
    }
    steps++;
}`,
  },
  {
    id: "dijkstra",
    title: "Dijkstra (shortest paths)",
    python: `import heapq

graph = [[] for _ in range(n)]  # graph[u] = [(v, w), ...]
dist = [float("inf")] * n
dist[src] = 0
heap = [(0, src)]
while heap:
    d, u = heapq.heappop(heap)
    if d > dist[u]:
        continue
    for v, w in graph[u]:
        if d + w < dist[v]:
            dist[v] = d + w
            heapq.heappush(heap, (dist[v], v))`,
    cpp: `vector<vector<pair<int, int>>> graph(n);  // graph[u] = {v, w}
vector<long long> dist(n, LLONG_MAX);
priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<>> pq;
dist[src] = 0;
pq.push({0, src});
while (!pq.empty()) {
    auto [d, u] = pq.top();
    pq.pop();
    if (d > dist[u]) continue;
    for (auto [v, w] : graph[u]) {
        if (d + w < dist[v]) {
            dist[v] = d + w;
            pq.push({dist[v], v});
        }
    }
}`,
    java: `List<int[]>[] graph = new List[n];  // graph[u] = {v, w}
for (int i = 0; i < n; i++) graph[i] = new ArrayList<>();
long[] dist = new long[n];
Arrays.fill(dist, Long.MAX_VALUE);
dist[src] = 0;
PriorityQueue<long[]> pq = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));
pq.add(new long[]{0, src});
while (!pq.isEmpty()) {
    long[] top = pq.poll();
    int u = (int) top[1];
    if (top[0] > dist[u]) continue;
    for (int[] e : graph[u]) {
        if (top[0] + e[1] < dist[e[0]]) {
            dist[e[0]] = top[0] + e[1];
            pq.add(new long[]{dist[e[0]], e[0]});
        }
    }
}`,
  },
  {
    id: "topo-sort",
    title: "Topological sort (Kahn)",
    python: `from collections import deque

graph = [[] for _ in range(n)]
indegree = [0] * n
for u, v in edges:
    graph[u].append(v)
    indegree[v] += 1

queue = deque(i for i in range(n) if indegree[i] == 0)
order = []
while queue:
    u = queue.popleft()
    order.append(u)
    for v in graph[u]:
        indegree[v] -= 1
        if indegree[v] == 0:
            queue.append(v)
has_cycle = len(order) < n`,
    cpp: `vector<vector<int>> graph(n);
vector<int> indegree(n, 0);
for (auto& e : edges) {
    graph[e[0]].push_back(e[1]);
    indegree[e[1]]++;
}
queue<int> q;
for (int i = 0; i < n; i++) if (indegree[i] == 0) q.push(i);
vector<int> order;
while (!q.empty()) {
    int u = q.front();
    q.pop();
    order.push_back(u);
    for (int v : graph[u]) if (--indegree[v] == 0) q.push(v);
}
bool hasCycle = order.size() < n;`,
    java: `List<Integer>[] graph = new List[n];
for (int i = 0; i < n; i++) graph[i] = new ArrayList<>();
int[] indegree = new int[n];
for (int[] e : edges) {
    graph[e[0]].add(e[1]);
    indegree[e[1]]++;
}
Deque<Integer> queue = new ArrayDeque<>();
for (int i = 0; i < n; i++) if (indegree[i] == 0) queue.add(i);
List<Integer> order = new ArrayList<>();
while (!queue.isEmpty()) {
    int u = queue.poll();
    order.add(u);
    for (int v : graph[u]) if (--indegree[v] == 0) queue.add(v);
}
boolean hasCycle = order.size() < n;`,
  },
  {
    id: "trie",
    title: "Trie",
    python: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.children.setdefault(ch, TrieNode())
        node.is_end = True

    def search(self, word, prefix=False):
        node = self.root
        for ch in word:
            if ch not in node.children:
                return False
            node = node.children[ch]
        return prefix or node.is_end`,
    cpp: `struct TrieNode {
    TrieNode* children[26] = {};
    bool isEnd = false;
};

struct Trie {
    TrieNode* root = new TrieNode();
    void insert(const string& word) {
        TrieNode* node = root;
        for (char c : word) {
            if (!node->children[c - 'a']) node->children[c - 'a'] = new TrieNode();
            node = node->children[c - 'a'];
        }
        node->isEnd = true;
    }
    bool search(const string& word, bool prefix = false) {
        TrieNode* node = root;
        for (char c : word) {
            if (!node->children[c - 'a']) return false;
            node = node->children[c - 'a'];
        }
        return prefix || node->isEnd;
    }
};`,
    java: `class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isEnd;
}

class Trie {
    TrieNode root = new TrieNode();

    void insert(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            if (node.children[c - 'a'] == null) node.children[c - 'a'] = new TrieNode();
            node = node.children[c - 'a'];
        }
        node.isEnd = true;
    }

    boolean search(String word, boolean prefix) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            if (node.children[c - 'a'] == null) return false;
            node = node.children[c - 'a'];
        }
        return prefix || node.isEnd;
    }
}`,
  },
  {
    id: "monotonic-stack",
    title: "Monotonic stack (next greater)",
    python: `result = [-1] * len(nums)
stack = []  # indices, values decreasing
for i, x in enumerate(nums):
    while stack and nums[stack[-1]] < x:
        result[stack.pop()] = x
    stack.append(i)`,
    cpp: `vector<int> result(nums.size(), -1);
stack<int> st;  // indices, values decreasing
for (int i = 0; i < (int)nums.size(); i++) {
    while (!st.empty() && nums[st.top()] < nums[i]) {
        result[st.top()] = nums[i];
        st.pop();
    }
    st.push(i);
}`,
    java: `int[] result = new int[nums.length];
Arrays.fill(result, -1);
Deque<Integer> stack = new ArrayDeque<>();  // indices, values decreasing
for (int i = 0; i < nums.length; i++) {
    while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
        result[stack.pop()] = nums[i];
    }
    stack.push(i);
}`,
  },
  {
    id: "backtracking",
    title: "Backtracking (subsets / combos)",
    python: `result = []
path = []

def backtrack(start):
    result.append(path[:])
    for i in range(start, len(nums)):
        if i > start and nums[i] == nums[i - 1]:
            continue  # skip duplicates (sort nums first)
        path.append(nums[i])
        backtrack(i + 1)
        path.pop()

nums.sort()
backtrack(0)`,
    cpp: `vector<vector<int>> result;
vector<int> path;
sort(nums.begin(), nums.end());
function<void(int)> backtrack = [&](int start) {
    result.push_back(path);
    for (int i = start; i < (int)nums.size(); i++) {
        if (i > start && nums[i] == nums[i - 1]) continue;  // skip duplicates
        path.push_back(nums[i]);
        backtrack(i + 1);
        path.pop_back();
    }
};
backtrack(0);`,
    java: `List<List<Integer>> result = new ArrayList<>();
Arrays.sort(nums);
backtrack(nums, 0, new ArrayList<>(), result);

// as a method:
void backtrack(int[] nums, int start, List<Integer> path, List<List<Integer>> result) {
    result.add(new ArrayList<>(path));
    for (int i = start; i < nums.length; i++) {
        if (i > start && nums[i] == nums[i - 1]) continue;  // skip duplicates
        path.add(nums[i]);
        backtrack(nums, i + 1, path, result);
        path.remove(path.size() - 1);
    }
}`,
  },
  {
    id: "prefix-sum-hashmap",
    title: "Prefix sum + hash map (subarray sum = k)",
    python: `from collections import defaultdict

seen = defaultdict(int)
seen[0] = 1
prefix = count = 0
for x in nums:
    prefix += x
    count += seen[prefix - k]
    seen[prefix] += 1`,
    cpp: `unordered_map<long long, int> seen{{0, 1}};
long long prefix = 0;
int count = 0;
for (int x : nums) {
    prefix += x;
    if (seen.count(prefix - k)) count += seen[prefix - k];
    seen[prefix]++;
}`,
    java: `Map<Long, Integer> seen = new HashMap<>();
seen.put(0L, 1);
long prefix = 0;
int count = 0;
for (int x : nums) {
    prefix += x;
    count += seen.getOrDefault(prefix - k, 0);
    seen.merge(prefix, 1, Integer::sum);
}`,
  },
];

export const BUILT_IN_SNIPPETS: Snippet[] = TEMPLATES.flatMap((t) =>
  (["python", "cpp", "java"] as const).map((lang) => ({
    id: `builtin:${t.id}:${lang}`,
    title: t.title,
    lang,
    code: t[lang],
    builtIn: true,
  }))
);

/** Maps Monaco language ids onto the snippet language buckets. */
export function snippetLang(monacoLang: string | null): string | null {
  if (!monacoLang) return null;
  if (monacoLang.startsWith("python")) return "python";
  if (monacoLang === "cpp" || monacoLang === "c") return "cpp";
  if (monacoLang === "java") return "java";
  return monacoLang;
}

export const LANG_LABEL: Record<string, string> = {
  python: "Python",
  cpp: "C++",
  java: "Java",
  javascript: "JavaScript",
  typescript: "TypeScript",
  go: "Go",
  rust: "Rust",
  csharp: "C#",
  kotlin: "Kotlin",
  swift: "Swift",
  any: "Any",
};
