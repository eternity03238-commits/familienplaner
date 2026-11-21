export type UUID = string;
export type Role = "adult" | "child" | "guardian" | "guest";
export type Scope = "school" | "tasks" | "sports" | "exams" | "projects" | "schedule";
export type Capability = "read" | "write";
export interface Person { id: UUID; displayName: string; birthDate?: string | null }
export interface Family { id: UUID; name: string; timeZone: string }
export interface Household { id: UUID; familyId: UUID; name: string }
export interface Membership { personId: UUID; familyId: UUID; role: Role }
/** DB mapping: child_guardianships; `verified` === (verified_at IS NOT NULL). */
export interface GuardianRelationship { childId: UUID; guardianId: UUID; verified: boolean }
/** DB mapping: access_grants (subject_person_id = subjectChildId, grantee_person_id, expires_at, revoked_at). */
export interface AccessGrant { subjectChildId: UUID; granteePersonId: UUID; scope: Scope; capability: Capability; expiresAt?: string | null; revokedAt?: string | null }
/** DB mapping: tasks.child_person_id, due_at (timestamptz), due_on (date, all-day deadline), status incl. 'cancelled', provenance. */
export interface Task { id: UUID; childId: UUID; title: string; dueAt?: string | null; dueOn?: string | null; status: "open" | "done" | "cancelled"; source?: string | null }
/** DB mapping: exams.child_person_id, subject_id -> subjects.name, title, exam_on (date), topics jsonb. */
export interface Exam { id: UUID; childId: UUID; subject: string; title?: string; date: string; topics: string[] }
export interface StudySlot { startsAt: string; endsAt: string; kind: "study" | "busy" }
