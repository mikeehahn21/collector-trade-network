import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("recommendation_feedback", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    user_id: { type: "uuid", notNull: true, references: "users(id)", onDelete: "cascade" },
    recommendation_id: { type: "text", notNull: true },
    counterparty_id: { type: "uuid", notNull: true, references: "users(id)", onDelete: "cascade" },
    target_item_id: { type: "uuid", references: "items(id)", onDelete: "set null" },
    rating: { type: "text", notNull: true },
    reason: { type: "text" },
    notes: { type: "text" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.addConstraint(
    "recommendation_feedback",
    "recommendation_feedback_user_recommendation_unique",
    "unique (user_id, recommendation_id)",
  );
  pgm.createIndex("recommendation_feedback", ["recommendation_id"]);
  pgm.createIndex("recommendation_feedback", ["rating", "created_at"]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("recommendation_feedback");
}
