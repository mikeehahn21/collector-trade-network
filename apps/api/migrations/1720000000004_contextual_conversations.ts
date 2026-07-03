import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("conversations", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    type: { type: "text", notNull: true },
    context_id: { type: "uuid", notNull: true },
    created_by_user_id: { type: "uuid", notNull: true, references: "users(id)", onDelete: "cascade" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    archived_at: { type: "timestamptz" },
  });

  pgm.addConstraint(
    "conversations",
    "conversations_type_valid",
    "check (type in ('item', 'trade', 'system'))",
  );
  pgm.addConstraint(
    "conversations",
    "conversations_context_creator_unique",
    "unique (type, context_id, created_by_user_id)",
  );
  pgm.createIndex("conversations", ["type", "context_id"]);
  pgm.createIndex("conversations", ["created_by_user_id"]);
  pgm.createIndex("conversations", ["updated_at"]);

  pgm.createTable("messages", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    conversation_id: {
      type: "uuid",
      notNull: true,
      references: "conversations(id)",
      onDelete: "cascade",
    },
    sender_id: { type: "uuid", notNull: true, references: "users(id)", onDelete: "cascade" },
    content: { type: "text", notNull: true },
    type: { type: "text", notNull: true, default: "text" },
    read_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.addConstraint(
    "messages",
    "messages_type_valid",
    "check (type in ('text', 'image', 'system_event'))",
  );
  pgm.createIndex("messages", ["conversation_id", "created_at"]);

  pgm.createTable("conversation_participants", {
    conversation_id: {
      type: "uuid",
      notNull: true,
      references: "conversations(id)",
      onDelete: "cascade",
    },
    user_id: { type: "uuid", notNull: true, references: "users(id)", onDelete: "cascade" },
    last_read_message_id: { type: "uuid", references: "messages(id)", onDelete: "set null" },
    last_read_at: { type: "timestamptz" },
    last_typing_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.addConstraint(
    "conversation_participants",
    "conversation_participants_pk",
    "primary key (conversation_id, user_id)",
  );
  pgm.createIndex("conversation_participants", ["user_id"]);

  pgm.sql(`
    create function archive_trade_conversation_on_delete()
    returns trigger as $$
    begin
      update conversations
      set archived_at = now(),
          updated_at = now()
      where type = 'trade'
        and context_id = old.id;
      return old;
    end;
    $$ language plpgsql;

    create trigger archive_trade_conversation_on_delete
    before delete on trades
    for each row
    execute function archive_trade_conversation_on_delete();

    create function archive_item_conversation_on_delete()
    returns trigger as $$
    begin
      update conversations
      set archived_at = now(),
          updated_at = now()
      where type = 'item'
        and context_id = old.id;
      return old;
    end;
    $$ language plpgsql;

    create trigger archive_item_conversation_on_delete
    before delete on items
    for each row
    execute function archive_item_conversation_on_delete();
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    drop trigger if exists archive_item_conversation_on_delete on items;
    drop function if exists archive_item_conversation_on_delete();
    drop trigger if exists archive_trade_conversation_on_delete on trades;
    drop function if exists archive_trade_conversation_on_delete();
  `);
  pgm.dropTable("conversation_participants");
  pgm.dropTable("messages");
  pgm.dropTable("conversations");
}
