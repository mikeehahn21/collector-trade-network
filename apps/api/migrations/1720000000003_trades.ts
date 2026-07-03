import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("trades", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    proposer_id: { type: "uuid", notNull: true, references: "users(id)", onDelete: "cascade" },
    counterparty_id: { type: "uuid", notNull: true, references: "users(id)", onDelete: "cascade" },
    proposer_item_id: { type: "uuid", notNull: true, references: "items(id)", onDelete: "restrict" },
    counterparty_item_id: {
      type: "uuid",
      notNull: true,
      references: "items(id)",
      onDelete: "restrict",
    },
    status: { type: "text", notNull: true, default: "pending" },
    proposer_notes: { type: "text" },
    counterparty_notes: { type: "text" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.addConstraint("trades", "trades_participants_distinct", "check (proposer_id <> counterparty_id)");
  pgm.addConstraint(
    "trades",
    "trades_items_distinct",
    "check (proposer_item_id <> counterparty_item_id)",
  );
  pgm.addConstraint(
    "trades",
    "trades_status_valid",
    "check (status in ('pending', 'accepted', 'declined', 'countered', 'cancelled', 'completed'))",
  );

  pgm.createIndex("trades", ["proposer_id", "status", "updated_at"]);
  pgm.createIndex("trades", ["counterparty_id", "status", "updated_at"]);
  pgm.createIndex("trades", ["proposer_item_id"]);
  pgm.createIndex("trades", ["counterparty_item_id"]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("trades");
}
