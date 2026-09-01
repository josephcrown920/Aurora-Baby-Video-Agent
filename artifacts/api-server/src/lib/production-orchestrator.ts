import { buildContextBundle, planBrainWork, serializeBrainContext, type BrainSource } from "@workspace/agent-brain";

export type GenerationCapability = "text-to-video" | "image-to-video" | "text-to-image" | "image-edit" | "video-edit" | "voice" | "music" | "sfx" | "captions" | "vision";

export type Provider = {
  id: "fal" | "replicate" | "vast";
  capabilities: GenerationCapability[];
  score: Partial<Record<GenerationCapability, number>>;
  configured: boolean;
};

export type ProductionRequest = {
  message: string;
  projectId?: string;
  activeSceneId?: string;
  activeShotId?: string;
  requestedOutput?: string;
  referencedArtifactIds?: string[];
  sources?: BrainSource[];
};

export type ProductionEvent = {
  type: "stage" | "context" | "plan" | "route" | "error" | "done";
  stage?: string;
  data?: unknown;
};

const env = (name: string) => Boolean(process.env[name]?.trim());

export function providerRegistry(): Provider[] {
  return [
    { id: "fal", configured: env("FAL_KEY"), capabilities: ["text-to-video", "image-to-video", "text-to-image", "image-edit", "vision", "voice", "music"], score: { "text-to-video": 0.92, "image-to-video": 0.94, "text-to-image": 0.92, "image-edit": 0.9, vision: 0.8, voice: 0.7, music: 0.7 } },
    { id: "replicate", configured: env("REPLICATE_API_TOKEN"), capabilities: ["text-to-video", "image-to-video", "text-to-image", "image-edit", "video-edit", "vision", "voice", "music", "sfx"], score: { "text-to-video": 0.9, "image-to-video": 0.92, "text-to-image": 0.9, "image-edit": 0.88, "video-edit": 0.82, vision: 0.84, voice: 0.76, music: 0.76, sfx: 0.7 } },
    { id: "vast", configured: env("VAST_API_KEY"), capabilities: ["text-to-video", "image-to-video", "text-to-image", "image-edit", "video-edit", "vision"], score: { "text-to-video": 0.96, "image-to-video": 0.97, "text-to-image": 0.94, "image-edit": 0.95, "video-edit": 0.9, vision: 0.9 } },
  ];
}

export function chooseProvider(capability: GenerationCapability, providers = providerRegistry()): Provider | undefined {
  return providers
    .filter((p) => p.configured && p.capabilities.includes(capability))
    .sort((a, b) => (b.score[capability] ?? 0) - (a.score[capability] ?? 0))[0];
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

export function createProductionEvents(input: ProductionRequest): ProductionEvent[] {
  const sources = input.sources ?? [];
  const query = {
    message: input.message,
    projectId: input.projectId,
    activeSceneId: input.activeSceneId,
    activeShotId: input.activeShotId,
    requestedOutput: input.requestedOutput,
    referencedArtifactIds: input.referencedArtifactIds,
  };
  const context = buildContextBundle(query, sources);
  const plan = planBrainWork(query, context);
  const capability = inferCapability(input.message);
  const provider = chooseProvider(capability);

  return [
    { type: "stage", stage: "understand", data: { intent: plan.intent } },
    { type: "context", data: { context: serializeBrainContext(context), sourceCount: context.sources.length, contradictions: context.contradictions } },
    { type: "stage", stage: "plan", data: plan },
    { type: "route", data: { capability, provider: provider?.id ?? null, configured: Boolean(provider) } },
    { type: "stage", stage: "inspect", data: { policy: "Inspect against the same project context before acceptance." } },
    { type: "done", data: { readyForGeneration: Boolean(provider), capability, provider: provider?.id ?? null } },
  ];
}

export function encodeSse(event: ProductionEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
