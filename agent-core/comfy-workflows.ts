export type ComfyWorkflow = {
  id: string;
  name: string;
  description: string;
  source: "comfyui" | "native";
  format: "api" | "ui";
  version: number;
  prompt: Record<string, unknown>;
  ui: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

function makeId(prefix = "wf") {
  return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

export function createBlankWorkflow(name = "New ComfyUI Workflow"): ComfyWorkflow {
  return { id: makeId(), name, description: "Editable ComfyUI API-format workflow", source: "native", format: "api", version: 1, prompt: {}, ui: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

export function isApiPrompt(value: unknown): value is Record<string, { class_type: string; inputs: Record<string, unknown> }> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const values = Object.values(value as Record<string, unknown>);
  return values.length > 0 && values.every((node) => !!node && typeof node === "object" && "class_type" in node && "inputs" in node);
}

export function parseComfyWorkflow(raw: unknown, name = "Imported ComfyUI Workflow"): ComfyWorkflow {
  if (!raw || typeof raw !== "object") throw new Error("Workflow JSON must be an object.");
  const object = raw as Record<string, any>;
  const apiPrompt = object.prompt && typeof object.prompt === "object" ? object.prompt : isApiPrompt(object) ? object : null;
  const uiWorkflow = Array.isArray(object.nodes) ? object : null;
  if (!apiPrompt && !uiWorkflow) throw new Error("Unsupported ComfyUI JSON.");
  return { id: makeId(), name: String(object.name || name), description: String(object.description || "Imported from ComfyUI"), source: "comfyui", format: apiPrompt ? "api" : "ui", version: Number(object.version || 1), prompt: apiPrompt || {}, ui: uiWorkflow, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

export function validateWorkflow(workflow: ComfyWorkflow) {
  const errors: string[] = [];
  if (!workflow.name.trim()) errors.push("Workflow name is required.");
  if (workflow.format !== "api") errors.push("Export editor-format workflows from ComfyUI as API format before running.");
  if (!isApiPrompt(workflow.prompt)) errors.push("No executable ComfyUI API graph was found.");
  return { ok: errors.length === 0, errors };
}

export function serializeWorkflow(workflow: ComfyWorkflow) {
  return workflow.format === "api" ? workflow.prompt : workflow.ui || workflow.prompt;
}
