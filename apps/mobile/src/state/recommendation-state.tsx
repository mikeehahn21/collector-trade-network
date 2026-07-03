import { useCallback, useEffect, useRef, useState } from "react";

import type { RecommendationSummary, TradeRecommendation } from "@ctn/types";

import { useApiClient } from "@/api/use-api-client";
import { useAuthSession } from "@/auth/use-auth-session";

const emptySummary: RecommendationSummary = {
  total: 0,
  grailMatches: 0,
  mutualMatches: 0,
  newMatches: 0,
};

export function useRecommendations() {
  const api = useApiClient();
  const apiRef = useRef(api);
  const auth = useAuthSession();
  const [recommendations, setRecommendations] = useState<TradeRecommendation[]>([]);
  const [summary, setSummary] = useState<RecommendationSummary>(emptySummary);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  const refresh = useCallback(async () => {
    if (!auth.isSignedIn) {
      setRecommendations([]);
      setSummary(emptySummary);
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      const response = await apiRef.current.listRecommendations();
      setRecommendations(response.recommendations);
      setSummary(response.summary);
    } catch {
      setError("We could not refresh trade opportunities. Try again shortly.");
    } finally {
      setIsLoading(false);
    }
  }, [auth.isSignedIn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    error,
    isLoading,
    recommendations,
    refresh,
    summary,
  };
}
