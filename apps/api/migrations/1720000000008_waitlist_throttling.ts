import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Global system configuration for access control
  pgm.createTable("system_config", {
    id: { type: "text", primaryKey: true },
    access_mode: { type: "text", notNull: true, default: "invite_only" },
    daily_invite_limit: { type: "integer", notNull: true, default: 0 },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  // Insert default config
  pgm.sql(`
    INSERT INTO system_config (id, access_mode, daily_invite_limit)
    VALUES ('global', 'waitlist', 50)
  `);

  // Add waitlist position tracking to access_applications
  pgm.addColumn("access_applications", {
    waitlist_position: { type: "integer" },
    invited_at: { type: "timestamptz" },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("access_applications", ["waitlist_position", "invited_at"]);
  pgm.dropTable("system_config");
}
