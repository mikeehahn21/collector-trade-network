import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createExtension("pgcrypto", { ifNotExists: true });

  pgm.createTable("users", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    clerk_user_id: { type: "text", notNull: true, unique: true },
    email: { type: "text", notNull: true },
    display_name: { type: "text", notNull: true },
    location_region: { type: "text" },
    bio: { type: "text" },
    social_handle: { type: "text" },
    access_status: { type: "text", notNull: true, default: "active" },
    roles: { type: "text[]", notNull: true, default: pgm.func("array['active_trader']") },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.createTable("access_applications", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    name: { type: "text", notNull: true },
    email: { type: "text", notNull: true },
    social_handle: { type: "text" },
    reason: { type: "text", notNull: true },
    status: { type: "text", notNull: true, default: "received" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.createTable("invite_codes", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    code: { type: "text", notNull: true, unique: true },
    status: { type: "text", notNull: true, default: "active" },
    invited_by_user_id: { type: "uuid", references: "users(id)", onDelete: "set null" },
    used_by_user_id: { type: "uuid", references: "users(id)", onDelete: "set null" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    used_at: { type: "timestamptz" },
  });

  pgm.createIndex("users", ["email"]);
  pgm.createIndex("access_applications", ["email", "status"]);
  pgm.createIndex("invite_codes", ["code", "status"]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("invite_codes");
  pgm.dropTable("access_applications");
  pgm.dropTable("users");
}
