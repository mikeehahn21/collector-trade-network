export type RecordSyncState = "live" | "local";

export function isLocalRecordId(id: string): boolean {
  return id.startsWith("item_") || id.startsWith("wish_") || id.startsWith("local_");
}

export function getRecordSyncState(id: string): RecordSyncState {
  return isLocalRecordId(id) ? "local" : "live";
}

export function getRecordSyncDescription(id: string): string {
  return getRecordSyncState(id) === "live"
    ? "LIVE • saved to Konnesor"
    : "LOCAL • saved on this iPhone";
}
