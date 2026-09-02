import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
};

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  context: jsonb("context").$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps,
});

export const contextSectionsTable = pgTable("context_sections", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  sectionType: text("section_type").notNull(),
  title: text("title").notNull(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull().default({}),
  status: text("status").notNull().default("APPROVED"),
  isLocked: boolean("is_locked").notNull().default(false),
  priority: integer("priority").notNull().default(4),
  ...timestamps,
});

export const notebookEntriesTable = pgTable("notebook_entries", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  entryType: text("entry_type").notNull(),
  description: text("description").notNull(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull().default({}),
  tags: text("tags").array().notNull().default([]),
  status: text("status").notNull().default("APPROVED"),
  source: text("source").notNull().default("user"),
  confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull().default("1"),
  approvalState: text("approval_state").notNull().default("APPROVED"),
  ...timestamps,
});

export const referenceAssetsTable = pgTable("reference_assets", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  notebookEntryId: integer("notebook_entry_id").references(() => notebookEntriesTable.id, { onDelete: "set null" }),
  sourceGenerationId: integer("source_generation_id"),
  name: text("name").notNull(),
  purpose: text("purpose").notNull(),
  authority: text("authority").notNull().default("SUPPORTING"),
  assetType: text("asset_type").notNull().default("image"),
  uri: text("uri"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps,
});

export const locksTable = pgTable("memory_locks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  label: text("label").notNull(),
  rule: text("rule").notNull(),
  scope: text("scope").notNull().default("project"),
  status: text("status").notNull().default("ACTIVE"),
  source: text("source").notNull().default("user"),
  ...timestamps,
});

export const acceptanceCriteriaTable = pgTable("acceptance_criteria", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  criterion: text("criterion").notNull(),
  category: text("category").notNull().default("continuity"),
  severity: text("severity").notNull().default("error"),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const generationsTable = pgTable("generations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  taskType: text("task_type").notNull(),
  task: text("task").notNull(),
  contextSnapshot: jsonb("context_snapshot").$type<Record<string, unknown>>().notNull().default({}),
  notebookReferences: integer("notebook_references").array().notNull().default([]),
  lockReferences: integer("lock_references").array().notNull().default([]),
  prompt: text("prompt").notNull(),
  model: text("model").notNull().default("pending"),
  provider: text("provider").notNull().default("pending"),
  result: jsonb("result").$type<Record<string, unknown>>().notNull().default({}),
  state: text("state").notNull().default("GENERATED"),
  approvalState: text("approval_state").notNull().default("GENERATED"),
  failureReason: text("failure_reason"),
  ...timestamps,
});

export const generationReviewsTable = pgTable("generation_reviews", {
  id: serial("id").primaryKey(),
  generationId: integer("generation_id").notNull().references(() => generationsTable.id, { onDelete: "cascade" }),
  summary: text("summary").notNull(),
  score: numeric("score", { precision: 4, scale: 3 }),
  accepted: boolean("accepted").notNull(),
  criteriaResults: jsonb("criteria_results").$type<Array<Record<string, unknown>>>().notNull().default([]),
  ...timestamps,
});

export const continuityEventsTable = pgTable("continuity_events", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  generationId: integer("generation_id").references(() => generationsTable.id, { onDelete: "set null" }),
  eventType: text("event_type").notNull(),
  code: text("code").notNull(),
  category: text("category").notNull(),
  message: text("message").notNull(),
  evidence: jsonb("evidence").$type<Record<string, unknown>>().notNull().default({}),
  severity: text("severity").notNull().default("info"),
  ...timestamps,
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContextSectionSchema = createInsertSchema(contextSectionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotebookEntrySchema = createInsertSchema(notebookEntriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReferenceAssetSchema = createInsertSchema(referenceAssetsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLockSchema = createInsertSchema(locksTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAcceptanceCriterionSchema = createInsertSchema(acceptanceCriteriaTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGenerationSchema = createInsertSchema(generationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGenerationReviewSchema = createInsertSchema(generationReviewsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContinuityEventSchema = createInsertSchema(continuityEventsTable).omit({ id: true, createdAt: true, updatedAt: true });

export type Project = z.infer<typeof insertProjectSchema>;
export type ContextSection = z.infer<typeof insertContextSectionSchema>;
export type NotebookEntry = z.infer<typeof insertNotebookEntrySchema>;
export type ReferenceAsset = z.infer<typeof insertReferenceAssetSchema>;
export type Lock = z.infer<typeof insertLockSchema>;
export type AcceptanceCriterion = z.infer<typeof insertAcceptanceCriterionSchema>;
export type Generation = z.infer<typeof insertGenerationSchema>;
export type GenerationReview = z.infer<typeof insertGenerationReviewSchema>;
export type ContinuityEvent = z.infer<typeof insertContinuityEventSchema>;