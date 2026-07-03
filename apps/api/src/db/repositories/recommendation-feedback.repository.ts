import type {
  RecommendationFeedback,
  RecommendationFeedbackMetrics,
  RecommendationFeedbackRating,
  RecommendationFeedbackReason,
} from "@ctn/types";

import type { Queryable } from "../types";
import { queryMany, queryOne } from "../types";

type RecommendationFeedbackRow = {
  id: string;
  user_id: string;
  recommendation_id: string;
  counterparty_id: string;
  target_item_id: string | null;
  rating: RecommendationFeedbackRating;
  reason: RecommendationFeedbackReason | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

type RecommendationFeedbackMetricRow = {
  total_feedback: string;
  helpful_count: string;
  not_relevant_count: string;
  latest_feedback_at: Date | null;
};

type NegativeReasonRow = {
  reason: RecommendationFeedbackReason;
  count: string;
};

export type UpsertRecommendationFeedbackInput = {
  userId: string;
  recommendationId: string;
  counterpartyId: string;
  targetItemId?: string | undefined;
  rating: RecommendationFeedbackRating;
  reason?: RecommendationFeedbackReason | undefined;
  notes?: string | undefined;
};

export async function upsertRecommendationFeedback(
  db: Queryable,
  input: UpsertRecommendationFeedbackInput,
): Promise<RecommendationFeedback> {
  const row = await queryOne<RecommendationFeedbackRow>(
    db,
    `
      insert into recommendation_feedback (
        user_id,
        recommendation_id,
        counterparty_id,
        target_item_id,
        rating,
        reason,
        notes
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (user_id, recommendation_id)
      do update set
        counterparty_id = excluded.counterparty_id,
        target_item_id = excluded.target_item_id,
        rating = excluded.rating,
        reason = excluded.reason,
        notes = excluded.notes,
        updated_at = now()
      returning *
    `,
    [
      input.userId,
      input.recommendationId,
      input.counterpartyId,
      input.targetItemId ?? null,
      input.rating,
      input.reason ?? null,
      input.notes ?? null,
    ],
  );

  if (!row) {
    throw new Error("Failed to save recommendation feedback.");
  }

  return mapFeedback(row);
}

export async function getRecommendationFeedbackMetrics(
  db: Queryable,
): Promise<RecommendationFeedbackMetrics> {
  const aggregate = await queryOne<RecommendationFeedbackMetricRow>(
    db,
    `
      select
        count(*)::text as total_feedback,
        count(*) filter (where rating = 'helpful')::text as helpful_count,
        count(*) filter (where rating = 'not_relevant')::text as not_relevant_count,
        max(updated_at) as latest_feedback_at
      from recommendation_feedback
    `,
  );
  const reasons = await queryMany<NegativeReasonRow>(
    db,
    `
      select reason, count(*)::text as count
      from recommendation_feedback
      where rating = 'not_relevant' and reason is not null
      group by reason
      order by count(*) desc, reason asc
      limit 5
    `,
  );
  const totalFeedback = Number(aggregate?.total_feedback ?? 0);
  const helpfulCount = Number(aggregate?.helpful_count ?? 0);
  const notRelevantCount = Number(aggregate?.not_relevant_count ?? 0);

  return {
    totalFeedback,
    helpfulCount,
    notRelevantCount,
    helpfulRate: totalFeedback > 0 ? Math.round((helpfulCount / totalFeedback) * 100) : 0,
    topNegativeReasons: reasons.map((reason) => ({
      reason: reason.reason,
      count: Number(reason.count),
    })),
    latestFeedbackAt: aggregate?.latest_feedback_at?.toISOString(),
  };
}

function mapFeedback(row: RecommendationFeedbackRow): RecommendationFeedback {
  return {
    id: row.id,
    userId: row.user_id,
    recommendationId: row.recommendation_id,
    counterpartyId: row.counterparty_id,
    targetItemId: row.target_item_id ?? undefined,
    rating: row.rating,
    reason: row.reason ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
