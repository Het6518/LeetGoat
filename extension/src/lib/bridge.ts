/**
 * Content-script side of public/bridge.js, which runs in LeetCode's page
 * world where the Monaco editor lives.
 */

type BridgeRequest = "info" | "getCode" | "insert";

interface BridgeResponse {
  __leetgoat: "from-page";
  type: "response";
  id: string;
  ok: boolean;
  result?: unknown;
  error?: string;
}

export interface PasteEvent {
  chars: number;
  lines: number;
  external: boolean;
}

let counter = 0;

export function bridgeRequest<T>(type: BridgeRequest, payload?: unknown, timeoutMs = 1500): Promise<T> {
  const id = `lg-${Date.now()}-${counter++}`;
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      reject(new Error("LeetCode editor isn't reachable yet — try again in a second."));
    }, timeoutMs);

    function onMessage(e: MessageEvent) {
      const data = e.data as BridgeResponse | undefined;
      if (e.source !== window || data?.__leetgoat !== "from-page" || data.type !== "response" || data.id !== id) return;
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      if (data.ok) resolve(data.result as T);
      else reject(new Error(data.error ?? "Bridge error"));
    }

    window.addEventListener("message", onMessage);
    window.postMessage({ __leetgoat: "to-page", id, type, payload }, window.location.origin);
  });
}

export function onBridgePaste(listener: (event: PasteEvent) => void): () => void {
  const handler = (e: MessageEvent) => {
    const data = e.data as { __leetgoat?: string; type?: string; event?: string } & PasteEvent;
    if (e.source !== window || data?.__leetgoat !== "from-page" || data.type !== "event" || data.event !== "paste") return;
    listener({ chars: data.chars, lines: data.lines, external: data.external });
  };
  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
}

export const insertIntoEditor = (text: string) => bridgeRequest<boolean>("insert", { text });
export const editorInfo = () => bridgeRequest<{ lang: string | null; ready: boolean }>("info", undefined, 800);

export interface BridgeVerdict {
  submissionId: string;
  statusMsg: string;
  accepted: boolean;
}

/** Judge results, read straight from LeetCode's own "check" responses. */
export function onBridgeVerdict(listener: (verdict: BridgeVerdict) => void): () => void {
  const handler = (e: MessageEvent) => {
    const data = e.data as {
      __leetgoat?: string;
      type?: string;
      event?: string;
      submissionId?: string;
      statusCode?: number;
      statusMsg?: string;
    };
    if (e.source !== window || data?.__leetgoat !== "from-page" || data.type !== "event" || data.event !== "verdict") return;
    if (!data.submissionId) return;
    listener({
      submissionId: data.submissionId,
      statusMsg: data.statusMsg ?? "",
      accepted: data.statusCode === 10 || data.statusMsg === "Accepted",
    });
  };
  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
}
