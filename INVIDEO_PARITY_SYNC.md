# Aurora parity synchronization

Aurora-Baby-Video-Agent is a downstream artifact of Aurora's production-agent architecture.

The implementation target is the same production graph used by Aurora:

Context → Plan → References → Vision → Generation → Approval → Slate → QA → Render → Repurpose

Required parity areas:
- persistent project context
- multi-input ingestion
- notebook pages and threads
- storyboard / looks / angles vision tooling
- character and world continuity locks
- capability-based model routing
- stock-before-generation selection
- reversible natural-language Slate revisions
- targeted regeneration instead of rebuilding unchanged shots
- captions and audio as first-class timeline tracks
- reusable workflows and playbooks
- incremental message streaming

Message streaming is exposed by `artifacts/api-server/src/routes/chat-stream.ts` through the Web Streams API. The host application should connect that handler to its authenticated chat endpoint and render incoming chunks immediately.

This file is the parity contract so future changes to the primary Aurora agent are not silently omitted from the Baby Agent.
