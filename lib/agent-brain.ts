import { z } from "zod";

/** Aurora Baby Agent brain: a project-aware harness inspired by InVideo Agent Two. */
export const BrainModalitySchema = z.enum(["text", "image", "video", "audio", "pdf", "document", "url", "timeline", "generation"]);
export type BrainModality = z.infer<typeof BrainModalitySchema>;
export const BrainSourceKindSchema = z.enum(["project_context", "brief", "playbook", "workflow", "conversation", "artifact", "reference", "generation", "timeline", "brand", "research", "decision", "qa"]);
export type BrainSourceKind = z.infer<typeof BrainSourceKindSchema>;

export type BrainSource = {
  id: string;
  kind: BrainSourceKind;
  title: string;
  content: string;
  modality?: BrainModality;
  projectId?: string;
  sceneIds?: string[];
  shotIds?: string[];
  tags?: string[];
  intent?: string;
  authority?: number;
  recency?: number;
  approved?: boolean;
  createdAt?: string;
};

export type BrainQuery = {
  message: string;
  projectId?: string;
  activeSceneId?: string;
  activeShotId?: string;
  requestedOutput?: string;
  referencedArtifactIds?: string[];
};

export type RankedSource = BrainSource & { score: number; reasons: string[] };
export type ContextBundle = {
  query: BrainQuery;
  sources: RankedSource[];
  durableRules: string[];
  lockedDecisions: string[];
  activeSceneIds: string[];
  activeShotIds: string[];
  contradictions: Array<{ a: string; b: string; reason: string }>;
};

export type BrainAction =
  | { type: "research"; query: string; why: string }
  | { type: "inspect_artifact"; artifactId: string; why: string }
  | { type: "recall"; kinds: BrainSourceKind[]; why: string }
  | { type: "delegate"; role: "producer" | "writer" | "dp" | "storyboard" | "editor" | "sound" | "qa"; task: string }
  | { type: "route_generation"; modality: "image" | "video" | "audio" | "music"; task: string }
  | { type: "revise_local"; sceneIds: string[]; shotIds: string[]; instruction: string }
  | { type: "assemble"; why: string }
  | { type: "qa"; scope: "shot" | "scene" | "project"; ids: string[] };

export type BrainPlan = {
  intent: "create" | "revise" | "research" | "inspect" | "organize" | "question";
  actions: BrainAction[];
  memoryWrites: string[];
  needsClarification: boolean;
  clarification?: string;
};

const STOP_WORDS = new Set(["the", "and", "for", "with", "that", "this", "from", "into", "make", "more", "very", "just", "want", "video", "shot", "scene", "please", "have", "keep"]);
const tokens = (text: string) => new Set(text.toLowerCase().replace(/[^a-z0-9:_-]+/g, " ").split(/\s+/).filter((x) => x.length > 2 && !STOP_WORDS.has(x)));
const overlap = (a: string, b: string) => {
  const left = tokens(a), right = tokens(b);
  if (!left.size || !right.size) return 0;
  let hits = 0;
  for (const token of left) if (right.has(token)) hits++;
  return hits / Math.max(1, Math.min(left.size, right.size));
};
const authorityFor = (s: BrainSource) => s.authority ?? (s.kind === "project_context" || s.kind === "decision" ? 1 : s.kind === "playbook" || s.kind === "brief" ? 0.95 : s.kind === "qa" ? 0.9 : 0.7);
const recencyFor = (s: BrainSource) => s.recency ?? (s.createdAt ? Math.max(0.05, Math.exp(-Math.max(0, (Date.now() - Date.parse(s.createdAt)) / 86400000) / 30)) : 0.5);

export function rankBrainSources(query: BrainQuery, sources: BrainSource[], limit = 40): RankedSource[] {
  return sources.map((source) => {
    const lexical = overlap(query.message, `${source.title}\n${source.content}\n${source.tags?.join(" ") ?? ""}`);
    const project = query.projectId ? (source.projectId === query.projectId ? 1 : 0) : 0.4;
    const local = (query.activeShotId && source.shotIds?.includes(query.activeShotId) ? 0.8 : 0) + (query.activeSceneId && source.sceneIds?.includes(query.activeSceneId) ? 0.6 : 0) + (query.referencedArtifactIds?.includes(source.id) ? 1 : 0);
    const authority = authorityFor(source);
    const score = lexical * 0.36 + project * 0.22 + Math.min(1, local) * 0.2 + authority * 0.12 + recencyFor(source) * 0.05 + (source.approved ? 0.15 : 0);
    const reasons = [lexical > 0.15 ? "matches request" : "", project === 1 ? "same project" : "", local > 0 ? "active scene/shot/reference" : "", authority >= 0.95 ? "high-authority rule" : "", source.approved ? "approved" : ""].filter(Boolean);
    return { ...source, score, reasons };
  }).filter((s) => s.score > 0.08).sort((a, b) => b.score - a.score).slice(0, limit);
}

export function buildContextBundle(query: BrainQuery, sources: BrainSource[], limit = 40): ContextBundle {
  const ranked = rankBrainSources(query, sources, limit);
  const sceneIds = new Set<string>(), shotIds = new Set<string>();
  ranked.forEach((s) => { s.sceneIds?.forEach((id) => sceneIds.add(id)); s.shotIds?.forEach((id) => shotIds.add(id)); });
  if (query.activeSceneId) sceneIds.add(query.activeSceneId);
  if (query.activeShotId) shotIds.add(query.activeShotId);
  const decisions = ranked.filter((s) => s.kind === "decision");
  const contradictions: ContextBundle["contradictions"] = [];
  for (let i = 0; i < decisions.length; i++) for (let j = i + 1; j < decisions.length; j++) {
    const a = decisions[i], b = decisions[j];
    if (a.sceneIds?.some((id) => b.sceneIds?.includes(id)) && overlap(a.content, b.content) < 0.05) contradictions.push({ a: a.id, b: b.id, reason: "Conflicting decisions target the same scene." });
  }
  return {
    query,
    sources: ranked,
    durableRules: ranked.filter((s) => ["project_context", "playbook", "brand"].includes(s.kind)).map((s) => s.content).slice(0, 12),
    lockedDecisions: ranked.filter((s) => s.kind === "decision" || s.approved).map((s) => s.content).slice(0, 12),
    activeSceneIds: [...sceneIds],
    activeShotIds: [...shotIds],
    contradictions: contradictions.slice(0, 8),
  };
}

function intentOf(message: string): BrainPlan["intent"] {
  const text = message.toLowerCase();
  if (/\b(research|find out|look up|reference|examples?)\b/.test(text)) return "research";
  if (/\b(change|replace|remove|shorten|lengthen|darker|brighter|faster|slower|revise|edit|fix|keep everything except)\b/.test(text)) return "revise";
  if (/\b(what|why|how|which|who|explain)\b/.test(text)) return "question";
  if (/\b(inspect|analy[sz]e|review|check|compare)\b/.test(text)) return "inspect";
  if (/\b(organize|sort|label|arrange)\b/.test(text)) return "organize";
  return "create";
}

export function planBrainWork(query: BrainQuery, context: ContextBundle): BrainPlan {
  const intent = intentOf(query.message);
  const actions: BrainAction[] = [{ type: "recall", kinds: ["project_context", "brief", "playbook", "decision", "brand", "research"], why: "Load project truth before acting." }];
  if (query.referencedArtifactIds?.length) query.referencedArtifactIds.slice(0, 8).forEach((id) => actions.push({ type: "inspect_artifact", artifactId: id, why: "User-provided evidence outranks a guess." }));
  if (intent === "research") actions.push({ type: "research", query: query.message, why: "The request requires external evidence." });
  if (intent === "create") {
    actions.push({ type: "delegate", role: "producer", task: "Turn the request into a brief, success criteria and production plan." });
    actions.push({ type: "delegate", role: "dp", task: "Build visual language, coverage and camera grammar." });
    actions.push({ type: "delegate", role: "storyboard", task: "Build continuity-aware shot coverage." });
    actions.push({ type: "route_generation", modality: "video", task: "Route each shot by capability, references, quality, latency, cost and availability." });
  }
  if (intent === "revise") {
    actions.push({ type: "revise_local", sceneIds: context.activeSceneIds, shotIds: context.activeShotIds, instruction: query.message });
    actions.push({ type: "qa", scope: context.activeShotIds.length ? "shot" : context.activeSceneIds.length ? "scene" : "project", ids: context.activeShotIds.length ? context.activeShotIds : context.activeSceneIds });
  }
  if (intent === "inspect") actions.push({ type: "qa", scope: context.activeShotIds.length ? "shot" : "project", ids: context.activeShotIds.length ? context.activeShotIds : context.activeSceneIds });
  if (intent === "organize") actions.push({ type: "assemble", why: "Organize approved media without regenerating it." });
  return {
    intent,
    actions,
    memoryWrites: intent === "create" ? ["Persist approved decisions, continuity locks, selected references and successful outputs."] : intent === "revise" ? ["Persist only the durable correction/decision; preserve unrelated memory."] : [],
    needsClarification: query.message.trim().length < 6,
    clarification: query.message.trim().length < 6 ? "What are you making or changing, and what should the result accomplish?" : undefined,
  };
}

export function serializeBrainContext(bundle: ContextBundle, maxChars = 24000): string {
  return [
    `USER REQUEST:\n${bundle.query.message}`,
    bundle.durableRules.length ? `PROJECT RULES:\n${bundle.durableRules.join("\n---\n")}` : "",
    bundle.lockedDecisions.length ? `LOCKED DECISIONS:\n${bundle.lockedDecisions.join("\n---\n")}` : "",
    bundle.contradictions.length ? `CONTRADICTIONS:\n${bundle.contradictions.map((c) => `${c.a} vs ${c.b}: ${c.reason}`).join("\n")}` : "",
    `RANKED EVIDENCE:\n${bundle.sources.map((s) => `[${s.kind}] ${s.title}\n${s.content}\nWHY: ${s.reasons.join(", ")}`).join("\n---\n")}`,
  ].filter(Boolean).join("\n\n").slice(0, maxChars);
}

export const INVIDEO_BRAIN_PRINCIPLES = [
  "Retrieve project truth; do not treat recent chat as the whole memory.",
  "Every uploaded input is evidence: understand its modality and intended role.",
  "Use hierarchy: project rules → brief → scene → shot → generation → edit.",
  "Approved outputs and explicit user decisions outrank speculative model text.",
  "Research compounds into reusable project knowledge.",
  "Specialists share one project state and can work in parallel.",
  "Route by capability, not by a fixed provider preference.",
  "Revisions are local by default and preserve unaffected shots.",
  "Inspect every result against the same context that produced it.",
  "Write only durable facts, decisions, references, approvals and corrections to memory.",
] as const;
