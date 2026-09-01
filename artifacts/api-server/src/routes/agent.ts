import { Router, type Request, type Response } from "express";
import { createProductionEvents, encodeSse, providerRegistry, type ProductionRequest } from "../lib/production-orchestrator";

const router = Router();

router.get("/agent/capabilities", (_req, res) => {
  res.json({
    providers: providerRegistry().map(({ id, capabilities, configured }) => ({ id, capabilities, configured })),
    workflow: ["understand", "context", "plan", "route", "generate", "inspect", "qa", "repair", "assemble", "render", "memory"],
    inputTypes: ["text", "image", "video", "audio", "pdf", "document", "url", "timeline", "generation"],
    visionTools: ["context", "notebook", "boards", "angles", "looks"],
  });
});

router.post("/agent/stream", async (req: Request, res: Response) => {
  const body = req.body as ProductionRequest;
  if (!body || typeof body.message !== "string" || !body.message.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const write = (payload: string) => { if (!res.writableEnded) res.write(payload); };
  const heartbeat = setInterval(() => write(": heartbeat\n\n"), 15000);

  try {
    for (const event of createProductionEvents(body)) {
      write(encodeSse(event));
      await new Promise((resolve) => setTimeout(resolve, 15));
    }
    write("data: [DONE]\n\n");
  } catch (error) {
    write(encodeSse({ type: "error", data: { message: error instanceof Error ? error.message : "Agent orchestration failed" } }));
    write("data: [DONE]\n\n");
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
});

export default router;
