import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("wishlist_items", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    owner_id: { type: "uuid", notNull: true, references: "users(id)", onDelete: "cascade" },
    title: { type: "text", notNull: true, default: "" },
    category: { type: "text" },
    size: { type: "text" },
    preferred_era: { type: "text" },
    preferred_tag: { type: "text" },
    preferred_condition: { type: "text" },
    notes: { type: "text" },
    priority: { type: "text", notNull: true, default: "medium" },
    is_grail: { type: "boolean", notNull: true, default: false },
    match_preference: { type: "text", notNull: true, default: "similar" },
    visibility: { type: "text", notNull: true, default: "approved_members" },
    is_archived: { type: "boolean", notNull: true, default: false },
    sort_order: { type: "integer", notNull: true, default: 0 },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    archived_at: { type: "timestamptz" },
  });

  pgm.createIndex("wishlist_items", ["owner_id", "is_archived", "sort_order"]);
  pgm.createIndex("wishlist_items", ["owner_id", "is_grail"]);
  pgm.createIndex("wishlist_items", ["category", "size"]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("wishlist_items");
}
