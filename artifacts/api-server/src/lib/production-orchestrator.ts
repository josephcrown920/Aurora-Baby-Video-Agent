export type BrainSource = {
  id: string;
  kind: string;
  title: string;
  content: string;
  projectId?: string;
  sceneIds?: string[];
  shotIds?: string[];
  tags?: string[];
  authority?: number;
  approved?: boolean;
};

export type GenerationCapability = "text-to-video" | "image-to-video" | "text-to-image" | "image-edit" | "video-edit" | "voice" | "music" | "sfx" | "captions" | "vision";
export type Provider = { id: "fal" | "replicate" | "vast"; capabilities: GenerationCapability[]; score: Partial<Record<GenerationCapability, number>>; configured: boolean };
export type ProductionRequest = { message: string; projectId?: string; activeSceneId?: string; activeShotId?: string; requestedOutput?: string; referencedArtifactIds?: string[]; sources?: BrainSource[] };
export type ProductionEvent = { type: "stage" | "context" | "plan" | "route" | "error" | "done"; stage?: string; data?: unknown };

const env = (name: string) => Boolean(process.env[name]?.trim());
const tokens = (text: string) => new Set(text.toLowerCase().replace(/[^a-z0-9:_-]+/g, " ").split(/\s+/).filter((x) => x.length > 2));
const overlap = (a: string, b: string) => { const l = tokens(a), r = tokens(b); if (!l.size || !r.size) return 0; let hits = 0; for (const x of l) if (r.has(x)) hits++; return hits / Math.max(1, Math.min(l.size, r.size)); };

export function providerRegistry(): Provider[] {
  return [
    { id: "fal", configured: env("FAL_KEY"), capabilities: ["text-to-video", "image-to-video", "text-to-image", "image-edit", "vision", "voice", "music"], score: { "text-to-video": 0.92, "image-to-video": 0.94, "text-to-image": 0.92, "image-edit": 0.9, vision: 0.8, voice: 0.7, music: 0.7 } },
    { id: "replicate", configured: env("REPLICATE_API_TOKEN"), capabilities: ["text-to-video", "image-to-video", "text-to-image", "image-edit", "video-edit", "vision", "voice", "music", "sfx"], score: { "text-to-video": 0.9, "image-to-video": 0.92, "text-to-image": 0.9, "image-edit": 0.88, "video-edit": 0.82, vision: 0.84, voice: 0.76, music: 0.76, sfx: 0.7 } },
    { id: "vast", configured: env("VAST_API_KEY"), capabilities: ["text-to-video", "image-to-video", "text-to-image", "image-edit", "video-edit", "vision"], score: { "text-to-video": 0.96, "image-to-video": 0.97, "text-to-image": 0.94, "image-edit": 0.95, "video-edit": 0.9, vision: 0.9 } },
  ];
}

export function chooseProvider(capability: GenerationCapability, providers = providerRegistry()): Provider | undefined {
  return providers.filter((p) => p.configured && p.capabilities.includes(capability)).sort((a, b) => (b.score[capability] ?? 0) - (a.score[capability] ?? 0))[0];
}

export function inferCapability(message: string): GenerationCapability {
  const text = message.toLowerCase();
  if (/\b(image|picture|poster|thumbnail)\b/.test(text)) return /\b(edit|change|remove|replace)\b/.test(text) ? "image-edit" : "text-to-image";
  if (/\b(voice|narration|voiceover|dub|avatar)\b/.test(text)) return "voice";
  if (/\b(music|song|score)\b/.test(text)) return "music";
  if (/\b(sound effect|sfx)\b/.test(text)) return "sfx";
  if (/\b(caption|subtitle|subtitles)\b/.test(text)) return "captions";
  if (/\b(edit|trim|replace|shorten|reframe|repurpose)\b/.test(text)) return "video-edit";
  if (/\b(reference|analy[sz]e|vision|look|angle|board)\b/.test(text)) return "vision";
  if (/\b(image-to-video|animate this|animate the image)\b/.test(text)) return "image-to-video";
  return "text-to-video";
}

function intentOf(message: string) {
  const t = message.toLowerCase();
  if (/\b(research|look up|find out|reference)\b/.test(t)) return "research";
  if (/\b(change|replace|remove|shorten|lengthen|revise|edit|fix|darker|brighter|faster|slower)\b/.test(t)) return "revise";
  if (/\b(what|why|how|which|who|explain)\b/.test(t)) return "question";
  if (/\b(inspect|analy[sz]e|review|check|compare)\b/.test(t)) return "inspect";
  if (/\b(organize|sort|label|arrange)\b/.test(t)) return "organize";
  return "create";
}

function retrieve(input: ProductionRequest) {
  return (input.sources ?? []).map((s) => {
    const lexical = overlap(input.message, `${s.title}\n${s.content}\n${s.tags?.join(" ") ?? ""}`);
    const project = input.projectId ? (s.projectId === input.projectId ? 1 : 0) : 0.4;
    const local = (input.activeShotId && s.shotIds?.includes(input.activeShotId) ? 0.8 : 0) + (input.activeSceneId && s.sceneIds?.includes(input.activeSceneId) ? 0.6 : 0) + (input.referencedArtifactIds?.includes(s.id) ? 1 : 0);
    const authority = s.authority ?? ((s.kind === "project_context" || s.kind === "decision") ? 1 : (s.kind === "brief" || s.kind === "playbook") ? 0.95 : 0.7);
    return { source: s, score: lexical * 0.4 + project * 0.2 + Math.min(1, local) * 0.2 + authority * 0.2 };
  }).filter((x) => x.score > 0.08).sort((a, b) => b.score - a.score).slice(0, 40);
}

export function createProductionEvents(input: ProductionRequest): ProductionEvent[] {
  const intent = intentOf(input.message);
  const evidence = retrieve(input);
  const capability = inferCapability(input.message);
  const provider = chooseProvider(capability);
  const locked = evidence.filter((x) => x.source.kind === "decision" || x.source.approved).map((x) => x.source.content).slice(0, 12);
  return [
    { type: "stage", stage: "understand", data: { intent } },
    { type: "context", data: { sourceCount: evidence.length, rankedEvidence: evidence.map((x) => ({ id: x.source.id, kind: x.source.kind, title: x.source.title, score: Number(x.score.toFixed(3)) })), lockedDecisions: locked } },
    { type: "plan", data: { intent, sequence: ["brief", "research/context", "script", "storyboard", "shot coverage", "capability routing", "generation", "inspection", "QA", "targeted repair", "edit", "delivery", "memory"], localRevisionPolicy: "Regenerate only affected scenes/shots." } },
    { type: "route", data: { capability, provider: provider?.id ?? null, configured: Boolean(provider), routingPolicy: "capability + reference/control + quality + latency + cost + availability" } },
    { type: "stage", stage: "inspect", data: { sameContext: true, approvalGate: true } },
    { type: "done", data: { readyForGeneration: Boolean(provider), capability, provider: provider?.id ?? null } },
  ];
}

export function encodeSse(event: ProductionEvent): string { return `data: ${JSON.stringify(event)}\n\n`; }
