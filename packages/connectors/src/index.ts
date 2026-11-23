export type ConnectionHealth = { status: "connected" | "reauth_required" | "disabled" | "error"; message?: string };
export interface ExternalResource { providerId: string; kind: "event" | "task" | "exam"; occurredAt?: string; updatedAt?: string; sourceUri?: string; payload: unknown }
export interface ChangesPage { resources: ExternalResource[]; nextCursor?: string; hasMore: boolean }
export interface ReadOnlyConnector {
  provider: string;
  health(): Promise<ConnectionHealth>;
  listChanges(cursor?: string): Promise<ChangesPage>;
}
/** Writes require a separate, explicit capability and approval gate. */
export interface WritableCalendarConnector extends ReadOnlyConnector {
  upsertApprovedEvent(event: ExternalResource, idempotencyKey: string): Promise<string>;
}
