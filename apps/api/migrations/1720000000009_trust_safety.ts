import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("user_reports", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    reporter_id: { type: "uuid", notNull: true, references: "users(id)", onDelete: "cascade" },
    reported_user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "cascade",
    },
    reason: { type: "text", notNull: true },
    note: { type: "text" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.addConstraint(
    "user_reports",
    "user_reports_users_distinct",
    "check (reporter_id <> reported_user_id)",
  );
  pgm.addConstraint(
    "user_reports",
    "user_reports_reason_valid",
    "check (reason in ('inappropriate_content', 'scam_fraud', 'harassment', 'other'))",
  );
  pgm.createIndex("user_reports", ["reporter_id", "created_at"]);
  pgm.createIndex("user_reports", ["reported_user_id", "created_at"]);

  pgm.createTable("user_blocks", {
    blocker_id: { type: "uuid", notNull: true, references: "users(id)", onDelete: "cascade" },
    blocked_user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "cascade",
    },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.addConstraint("user_blocks", "user_blocks_pk", "primary key (blocker_id, blocked_user_id)");
  pgm.addConstraint(
    "user_blocks",
    "user_blocks_users_distinct",
    "check (blocker_id <> blocked_user_id)",
  );
  pgm.createIndex("user_blocks", ["blocked_user_id"]);

  pgm.addColumns("trades", {
    completed_confirmed_at_proposer: { type: "timestamptz" },
    completed_confirmed_at_counterparty: { type: "timestamptz" },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("trades", [
    "completed_confirmed_at_proposer",
    "completed_confirmed_at_counterparty",
  ]);
  pgm.dropTable("user_blocks");
  pgm.dropTable("user_reports");
}
