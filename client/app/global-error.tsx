"use client"; // Global error boundaries must be Client Components.

import { useEffect } from "react";

import { isAppDebug } from "@/lib/app-flags";

/**
 * Catastrophic root error boundary — replaces the root layout when even it fails
 * to render, so it must ship its own <html>/<body> and can't rely on the app's
 * providers or CSS. Styles are inlined so it renders correctly regardless.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          background: "#f7f7f6",
          color: "#1a1a1a",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fee2e2",
            color: "#dc2626",
            fontSize: 30,
            marginBottom: 20,
          }}
          aria-hidden
        >
          !
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Something went wrong</h1>
        <p style={{ marginTop: 8, maxWidth: 420, color: "#6b7280" }}>
          A critical error occurred. Please try reloading the page.
        </p>
        {error.digest && (
          <p style={{ marginTop: 8, fontSize: 12, color: "#9ca3af" }}>Reference: {error.digest}</p>
        )}
        {/* App Debug (Settings → System): show the real error + stack. */}
        {isAppDebug() && (
          <pre
            style={{
              marginTop: 16,
              maxWidth: 640,
              maxHeight: 260,
              overflow: "auto",
              textAlign: "left",
              padding: "0.75rem 1rem",
              borderRadius: 10,
              background: "#1a1a1a",
              color: "#fca5a5",
              fontSize: 12,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {error.message}
            {error.stack ? `\n\n${error.stack}` : ""}
          </pre>
        )}
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 28,
            padding: "0.65rem 1.4rem",
            borderRadius: 12,
            border: "none",
            background: "#c1121f",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
