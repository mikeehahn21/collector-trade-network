import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Add reputation fields to the users table
  pgm.addColumns("users", {
    trust_score: {
      type: "integer",
      notNull: true,
      default: 50,
      comment: "Dynamic score from 0-100 based on trade history and verification",
    },
    is_elite: {
      type: "boolean",
      notNull: true,
      default: false,
      comment: "Premium tier status for high-performing users",
    },
    reputation_updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  // Add constraint to ensure trust score is between 0 and 100
  pgm.addConstraint(
    "users",
    "users_trust_score_range",
    "check (trust_score >= 0 and trust_score <= 100)",
  );

  // Add index for fast querying of elite users
  pgm.createIndex("users", ["is_elite"]);
  pgm.createIndex("users", ["trust_score"]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("users", ["trust_score"]);
  pgm.dropIndex("users", ["is_elite"]);
  pgm.dropConstraint("users", "users_trust_score_range");
  pgm.dropColumns("users", ["trust_score", "is_elite", "reputation_updated_at"]);
}
