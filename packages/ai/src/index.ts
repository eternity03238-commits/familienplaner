/** AI may only produce proposals. Validation and commits live in application services. */
export interface PlanningSuggestionInput { grade: number; subject: string; examDate: string; topics: string[]; maxExtraMinutesDaily: number }
export interface LearningStep { title: string; estimatedMinutes: number; dependsOn?: number[] }
export interface PlanningSuggestion { reason: string; steps: LearningStep[]; confidence: "low" | "medium" | "high" }
export interface AiPlanner { proposeLearningSteps(input: PlanningSuggestionInput): Promise<PlanningSuggestion> }
export class AiNotConfiguredError extends Error { constructor() { super("AI provider is not configured; no model call was made."); } }
