import { apiRoutes } from "@ctn/api-contracts";
import type { HealthResponse, RecommendationFeedbackMetricsResponse } from "@ctn/api-contracts";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${apiBaseUrl}${apiRoutes.health}`, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Health request failed with status ${response.status}`);
  }

  return (await response.json()) as HealthResponse;
}

export async function getRecommendationFeedbackMetrics(
  bearerToken?: string,
): Promise<RecommendationFeedbackMetricsResponse> {
  const response = await fetch(`${apiBaseUrl}${apiRoutes.recommendationFeedbackMetrics}`, {
    headers: {
      accept: "application/json",
      ...(bearerToken ? { authorization: `Bearer ${bearerToken}` } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Recommendation metrics request failed with status ${response.status}`);
  }

  return (await response.json()) as RecommendationFeedbackMetricsResponse;
}
