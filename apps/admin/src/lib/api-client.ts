import { apiRoutes } from "@ctn/api-contracts";
import type {
  HealthResponse,
  RecommendationFeedbackMetricsResponse,
  ReputationMetricsResponse,
  ReputationRecalculateResponse,
} from "@ctn/api-contracts";

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

export async function getReputationMetrics(
  bearerToken?: string,
): Promise<ReputationMetricsResponse> {
  const response = await fetch(`${apiBaseUrl}${apiRoutes.reputationMetrics}`, {
    headers: {
      accept: "application/json",
      ...(bearerToken ? { authorization: `Bearer ${bearerToken}` } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Reputation metrics request failed with status ${response.status}`);
  }

  return (await response.json()) as ReputationMetricsResponse;
}

export async function recalculateReputation(
  bearerToken?: string,
): Promise<ReputationRecalculateResponse> {
  const response = await fetch(`${apiBaseUrl}${apiRoutes.reputationRecalculate}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      ...(bearerToken ? { authorization: `Bearer ${bearerToken}` } : {}),
    },
    body: JSON.stringify({}),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Reputation recalculate request failed with status ${response.status}`);
  }

  return (await response.json()) as ReputationRecalculateResponse;
}
