import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("trades", {
    shipping_status_proposer: { type: "text", notNull: true, default: "pending" },
    shipping_status_counterparty: { type: "text", notNull: true, default: "pending" },
    tracking_number_proposer: { type: "text" },
    tracking_number_counterparty: { type: "text" },
    carrier_proposer: { type: "text" },
    carrier_counterparty: { type: "text" },
    completed_at: { type: "timestamptz" },
    disputed_at: { type: "timestamptz" },
    dispute_reason: { type: "text" },
  });

  pgm.dropConstraint("trades", "trades_status_valid");
  pgm.addConstraint(
    "trades",
    "trades_status_valid",
    "check (status in ('pending', 'accepted', 'declined', 'countered', 'cancelled', 'completed', 'disputed'))",
  );
  pgm.addConstraint(
    "trades",
    "trades_shipping_status_proposer_valid",
    "check (shipping_status_proposer in ('pending', 'shipped', 'delivered'))",
  );
  pgm.addConstraint(
    "trades",
    "trades_shipping_status_counterparty_valid",
    "check (shipping_status_counterparty in ('pending', 'shipped', 'delivered'))",
  );
  pgm.addConstraint(
    "trades",
    "trades_carrier_proposer_valid",
    "check (carrier_proposer is null or carrier_proposer in ('ups', 'usps', 'fedex', 'dhl', 'other'))",
  );
  pgm.addConstraint(
    "trades",
    "trades_carrier_counterparty_valid",
    "check (carrier_counterparty is null or carrier_counterparty in ('ups', 'usps', 'fedex', 'dhl', 'other'))",
  );

  pgm.createIndex("trades", ["shipping_status_proposer"]);
  pgm.createIndex("trades", ["shipping_status_counterparty"]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("trades", ["shipping_status_counterparty"]);
  pgm.dropIndex("trades", ["shipping_status_proposer"]);
  pgm.dropConstraint("trades", "trades_carrier_counterparty_valid");
  pgm.dropConstraint("trades", "trades_carrier_proposer_valid");
  pgm.dropConstraint("trades", "trades_shipping_status_counterparty_valid");
  pgm.dropConstraint("trades", "trades_shipping_status_proposer_valid");
  pgm.dropConstraint("trades", "trades_status_valid");
  pgm.addConstraint(
    "trades",
    "trades_status_valid",
    "check (status in ('pending', 'accepted', 'declined', 'countered', 'cancelled', 'completed'))",
  );
  pgm.dropColumn("trades", "dispute_reason");
  pgm.dropColumn("trades", "disputed_at");
  pgm.dropColumn("trades", "completed_at");
  pgm.dropColumn("trades", "carrier_counterparty");
  pgm.dropColumn("trades", "carrier_proposer");
  pgm.dropColumn("trades", "tracking_number_counterparty");
  pgm.dropColumn("trades", "tracking_number_proposer");
  pgm.dropColumn("trades", "shipping_status_counterparty");
  pgm.dropColumn("trades", "shipping_status_proposer");
}
