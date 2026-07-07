"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { recalculateReputation } from "@/lib/api-client";

export function RecalculateButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const { getToken } = useAuth();

  async function handleRecalculate() {
    setIsLoading(true);
    setStatus("idle");

    try {
      const token = await getToken();
      await recalculateReputation(token ?? undefined);
      setStatus("success");

      // Reset success message after 3 seconds
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      console.error(error);
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      {status === "success" && (
        <span style={{ color: "var(--success-color)", fontSize: "0.875rem" }}>
          Recalculation queued
        </span>
      )}
      {status === "error" && (
        <span style={{ color: "var(--error-color)", fontSize: "0.875rem" }}>Failed to queue</span>
      )}
      <button
        onClick={() => {
          void handleRecalculate();
        }}
        disabled={isLoading}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "var(--accent-color)",
          color: "white",
          border: "none",
          borderRadius: "0.25rem",
          fontWeight: 600,
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading ? "Queueing..." : "Recalculate Scores"}
      </button>
    </div>
  );
}
