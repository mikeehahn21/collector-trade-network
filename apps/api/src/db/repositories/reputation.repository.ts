import type { ReputationMetrics } from "@ctn/types";
import type { Queryable } from "../types";
import { queryOne } from "../types";

export async function getReputationMetrics(db: Queryable): Promise<ReputationMetrics> {
  const row = await queryOne<{
    avg_score: string;
    elite_count: string;
    total_users: string;
    last_updated: Date;
  }>(
    db,
    `
      select
        coalesce(avg(trust_score), 50) as avg_score,
        count(*) filter (where is_elite = true) as elite_count,
        count(*) as total_users,
        max(reputation_updated_at) as last_updated
      from users
      where access_status = 'active'
    `,
  );

  if (!row) {
    return {
      averageTrustScore: 50,
      eliteUserCount: 0,
      totalUsers: 0,
      lastRecalculatedAt: new Date().toISOString(),
    };
  }

  return {
    averageTrustScore: Math.round(Number.parseFloat(row.avg_score)),
    eliteUserCount: Number.parseInt(row.elite_count, 10),
    totalUsers: Number.parseInt(row.total_users, 10),
    lastRecalculatedAt: (row.last_updated ?? new Date()).toISOString(),
  };
}

export async function recalculateAllScores(db: Queryable): Promise<void> {
  // This is a simplified version of the reputation engine logic
  // In a real production system, this would be a complex batch job
  // that considers trade history, verification status, and communication

  await db.query(`
    with user_stats as (
      select
        u.id as user_id,
        count(distinct t.id) filter (where t.status = 'completed') as completed_trades,
        count(distinct t.id) filter (where t.status = 'disputed') as disputed_trades,
        bool_or(case when 'verified_collector' = any(u.roles) or 'verified_seller' = any(u.roles) then true else false end) as is_verified
      from users u
      left join trades t on t.proposer_id = u.id or t.counterparty_id = u.id
      where u.access_status = 'active'
      group by u.id
    ),
    calculated_scores as (
      select
        user_id,
        -- Base score 50
        -- +10 for being verified
        -- +5 for each completed trade (up to 40)
        -- -20 for each disputed trade
        least(100, greatest(0, 
          50 
          + case when is_verified then 10 else 0 end
          + least(40, completed_trades * 5)
          - (disputed_trades * 20)
        )) as new_score
      from user_stats
    )
    update users u
    set 
      trust_score = c.new_score,
      is_elite = case when c.new_score >= 90 then true else false end,
      reputation_updated_at = now()
    from calculated_scores c
    where u.id = c.user_id
  `);
}
