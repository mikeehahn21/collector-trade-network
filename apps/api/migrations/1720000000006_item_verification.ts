import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("items", {
    verification_video_url: { type: "text" },
    verification_status: { type: "text", notNull: true, default: "pending" },
    verification_failed_reason: { type: "text" },
    verified_at: { type: "timestamptz" },
    ai_metadata: { type: "jsonb" },
  });

  pgm.addConstraint(
    "items",
    "items_verification_status_valid",
    "check (verification_status in ('pending', 'verified', 'failed'))",
  );
  pgm.addConstraint(
    "items",
    "items_verification_video_url_length",
    "check (verification_video_url is null or char_length(verification_video_url) <= 512)",
  );
  pgm.createIndex("items", ["verification_status"]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("items", ["verification_status"]);
  pgm.dropConstraint("items", "items_verification_video_url_length");
  pgm.dropConstraint("items", "items_verification_status_valid");
  pgm.dropColumn("items", "ai_metadata");
  pgm.dropColumn("items", "verified_at");
  pgm.dropColumn("items", "verification_failed_reason");
  pgm.dropColumn("items", "verification_status");
  pgm.dropColumn("items", "verification_video_url");
}
