import { auth } from "@clerk/nextjs/server";

import { AdminShell } from "@/components/admin-shell";
import { getRecommendationFeedbackMetrics, getReputationMetrics } from "@/lib/api-client";
import { RecalculateButton } from "./recalculate-button";

export default async function AdminHomePage() {
  const metrics = await getMetricsSafely();
  const repMetrics = await getReputationMetricsSafely();

  return (
    <AdminShell>
      <section className="panel" style={{ marginBottom: "2rem" }}>
        <p className="eyebrow">Sprint 12</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>Reputation Engine</h1>
          <RecalculateButton />
        </div>
        <p>
          The dynamic trust score system evaluates completed trades, verification status, and
          communication responsiveness to identify Elite Collectors.
        </p>
        {repMetrics ? (
          <div className="metric-grid">
            <MetricCard label="Average Score" value={repMetrics.averageTrustScore} />
            <MetricCard label="Elite Collectors" value={repMetrics.eliteUserCount} />
            <MetricCard label="Total Users" value={repMetrics.totalUsers} />
            <MetricCard
              label="Last Recalculated"
              value={new Date(repMetrics.lastRecalculatedAt).toLocaleDateString()}
            />
          </div>
        ) : (
          <div className="subpanel">
            <h2>Metrics unavailable</h2>
            <p className="muted">
              Connect admin authentication to the API before live reputation metrics can be
              displayed.
            </p>
          </div>
        )}
      </section>

      <section className="panel">
        <p className="eyebrow">Sprint 7</p>
        <h1>Recommendation quality</h1>
        <p>
          Feedback from collectors helps identify whether the deterministic Trade Graph is producing
          useful matches before AI ranking is introduced.
        </p>
        {metrics ? (
          <>
            <div className="metric-grid">
              <MetricCard label="Total feedback" value={metrics.totalFeedback} />
              <MetricCard label="Helpful" value={metrics.helpfulCount} />
              <MetricCard label="Not relevant" value={metrics.notRelevantCount} />
              <MetricCard label="Helpful rate" value={`${metrics.helpfulRate}%`} />
            </div>
            <div className="subpanel">
              <h2>Top negative reasons</h2>
              {metrics.topNegativeReasons.length > 0 ? (
                <ul className="reason-list">
                  {metrics.topNegativeReasons.map((reason) => (
                    <li key={reason.reason}>
                      <span>{formatReason(reason.reason)}</span>
                      <strong>{reason.count}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No negative feedback has been recorded yet.</p>
              )}
            </div>
          </>
        ) : (
          <div className="subpanel">
            <h2>Metrics unavailable</h2>
            <p className="muted">
              Connect admin authentication to the API before live recommendation quality metrics can
              be displayed here.
            </p>
          </div>
        )}
      </section>
    </AdminShell>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

async function getMetricsSafely() {
  try {
    const token = await getAdminBearerTokenSafely();
    const response = await getRecommendationFeedbackMetrics(token ?? undefined);
    return response.metrics;
  } catch {
    return undefined;
  }
}

async function getReputationMetricsSafely() {
  try {
    const token = await getAdminBearerTokenSafely();
    const response = await getReputationMetrics(token ?? undefined);
    return response.metrics;
  } catch {
    return undefined;
  }
}

async function getAdminBearerTokenSafely() {
  try {
    const session = await auth();
    return await session.getToken();
  } catch {
    return undefined;
  }
}

function formatReason(reason: string): string {
  return reason
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
