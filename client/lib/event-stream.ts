/**
 * Minimal fetch-based SSE reader for **authenticated** streams.
 *
 * The browser's native `EventSource` can't set an `Authorization` header, so for
 * staff/tenant streams (e.g. the KDS board) we read the stream with `fetch` and
 * send a bearer token. Handles reconnection with backoff; the token is refetched
 * on every (re)connect so a rotated token is picked up automatically.
 */
export interface EventStreamHandlers {
  /** Resolve the bearer token for each (re)connect. Return undefined to skip. */
  getToken?: () => Promise<string | undefined> | string | undefined;
  onEvent: (data: Record<string, unknown>) => void;
  onOpen?: () => void;
  onError?: () => void;
}

const MAX_BACKOFF_MS = 15_000;

export function openEventStream(url: string, handlers: EventStreamHandlers): () => void {
  const controller = new AbortController();
  let closed = false;
  let attempt = 0;

  async function connect(): Promise<void> {
    while (!closed) {
      try {
        const token = handlers.getToken ? await handlers.getToken() : undefined;
        const res = await fetch(url, {
          headers: {
            Accept: "text/event-stream",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(`stream ${res.status}`);

        attempt = 0;
        handlers.onOpen?.();

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE frames are separated by a blank line.
          let sep: number;
          while ((sep = buffer.indexOf("\n\n")) !== -1) {
            const frame = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            const data = frame
              .split("\n")
              .filter((l) => l.startsWith("data:"))
              .map((l) => l.slice(5).trim())
              .join("");
            if (!data) continue;
            try {
              handlers.onEvent(JSON.parse(data) as Record<string, unknown>);
            } catch {
              /* ignore malformed frame */
            }
          }
        }
      } catch {
        if (closed) return;
        handlers.onError?.();
      }
      // Reconnect with exponential backoff (unless we were closed).
      if (closed) return;
      const delay = Math.min(1000 * 2 ** attempt++, MAX_BACKOFF_MS);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  void connect();

  return () => {
    closed = true;
    controller.abort();
  };
}
