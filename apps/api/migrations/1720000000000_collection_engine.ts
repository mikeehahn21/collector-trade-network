import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createExtension("pgcrypto", { ifNotExists: true });

  pgm.createTable("items", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    owner_id: { type: "uuid", notNull: true, references: "users(id)", onDelete: "cascade" },
    title: { type: "text", notNull: true, default: "" },
    category: { type: "text" },
    size: { type: "text" },
    measurements: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    era: { type: "text" },
    tag: { type: "text" },
    condition: { type: "text" },
    flaws: { type: "jsonb", notNull: true, default: pgm.func("'[]'::jsonb") },
    estimated_value: {
      type: "jsonb",
      notNull: true,
      default: pgm.func(`'{"currency":"USD"}'::jsonb`),
    },
    status: { type: "text", notNull: true, default: "draft" },
    trade_preference: { type: "text" },
    trade_notes: { type: "text" },
    visibility: { type: "text", notNull: true, default: "private" },
    communication_preference: { type: "text", notNull: true, default: "approved_traders" },
    allows_photo_requests: { type: "boolean", notNull: true, default: true },
    allows_measurement_requests: { type: "boolean", notNull: true, default: true },
    ai_suggestions: { type: "jsonb" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    published_at: { type: "timestamptz" },
    archived_at: { type: "timestamptz" },
  });

  pgm.createTable("item_photos", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    item_id: {
      type: "uuid",
      notNull: true,
      references: "items(id)",
      onDelete: "cascade",
    },
    storage_key: { type: "text", notNull: true },
    public_url: { type: "text" },
    kind: { type: "text", notNull: true },
    sort_order: { type: "integer", notNull: true, default: 0 },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.createIndex("items", ["owner_id", "status"]);
  pgm.createIndex("items", ["category", "size"]);
  pgm.createIndex("item_photos", ["item_id", "sort_order"]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("item_photos");
  pgm.dropTable("items");
}
