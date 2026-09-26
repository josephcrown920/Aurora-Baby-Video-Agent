import { Router, type Request, type Response } from "express";

const router = Router();
const BASE_URL = (process.env.COMFYUI_BASE_URL || "http://127.0.0.1:8188").replace(/\/$/, "");
const POLL_MS = Number(process.env.COMFYUI_POLL_MS || 1000);
const TIMEOUT_MS = Number(process.env.COMFYUI_TIMEOUT_MS || 300000);

async function requestComfy(path: string, init: RequestInit = {}) {
  const response = await fetch(BASE_URL + path, { ...init, headers: { "Content-Type": "application/json", ...(init.headers || {}) } });
  const text = await response.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!response.ok) throw new Error(data?.error?.message || data?.error || data?.raw || "ComfyUI request failed.");
  return data;
}

router.get("/workflows/comfy/health", async (_req: Request, res: Response) => {
  try {
    const data = await requestComfy("/system_stats");
    res.json({ ok: true, data, baseUrl: BASE_URL });
  } catch (error) {
    res.status(503).json({ ok: false, error: error instanceof Error ? error.message : "ComfyUI unavailable.", baseUrl: BASE_URL });
  }
});

router.post("/workflows/comfy/run", async (req: Request, res: Response) => {
  try {
    const body = req.body as { workflow?: Record<string, unknown>; wait?: boolean; clientId?: string };
    if (!body.workflow) { res.status(400).json({ ok: false, error: "workflow is required." }); return; }
    const clientId = body.clientId || crypto.randomUUID();
    const queued = await requestComfy("/prompt", { method: "POST", body: JSON.stringify({ prompt: body.workflow, client_id: clientId }) });
    const promptId = queued.prompt_id;
    if (!promptId || body.wait === false) { res.json({ ok: true, promptId, queued, clientId }); return; }
    const started = Date.now();
    while (Date.now() - started < TIMEOUT_MS) {
      await new Promise((resolve) => setTimeout(resolve, POLL_MS));
      const history = await requestComfy("/history/" + encodeURIComponent(promptId));
      const entry = history?.[promptId];
      if (!entry) continue;
      if (entry.status?.status_str === "error") { res.status(500).json({ ok: false, promptId, history: entry }); return; }
      if (entry.status?.completed || entry.outputs) { res.json({ ok: true, promptId, outputs: entry.outputs || {}, history: entry }); return; }
    }
    res.status(504).json({ ok: false, promptId, error: "ComfyUI execution timed out." });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "ComfyUI execution failed." });
  }
});

export default router;
