# Aurora parity synchronization

Aurora-Baby-Video-Agent is a downstream artifact of Aurora's production-agent architecture.

The implementation target is the same production graph used by Aurora, now explicitly including the InVideo-style brain/harness:

Context → Input understanding → Retrieval → Reconciliation → Plan → Specialist handoff → Capability routing → Generation → Inspection → Approval → Slate → QA → Render → Repurpose → Memory

## Brain parity

The agent must behave like a production collaborator, not a prompt wrapper.

- **Hierarchical memory:** project Context holds durable truth; Briefs hold the current job; scenes and shots hold local state.
- **Multi-input intelligence:** images, videos, PDFs, documents, URLs, audio, timelines and prior generations are treated as evidence and analyzed for intended role.
- **Ranked retrieval:** do not dump the entire database into the model. Retrieve by project, scene/shot locality, semantic relevance, authority, recency and approval state.
- **Reconciliation:** explicit user decisions and approved outputs outrank speculative model text; contradictions are surfaced before action.
- **Research compounding:** useful findings become project research memory so later shots can reuse them.
- **Expert delegation:** producer, writer, DP, storyboard, editor, sound and QA roles can work in parallel against the same project state.
- **Capability routing:** model selection is based on modality, references, identity/control, quality, latency, cost and availability, not a fixed provider preference.
- **Local revisions:** natural-language edits resolve to scene/shot addresses and regenerate only affected media.
- **Closed-loop QA:** inspect outputs against the same Context that produced them, score failures, repair locally, then reassemble.
- **Selective memory writes:** store durable facts, decisions, approved references, successful outputs and corrections, not every conversational sentence.

## Required parity areas

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

## Streaming

Message streaming is exposed by `artifacts/api-server/src/routes/chat-stream.ts` through the Web Streams API. The host application should connect that handler to its authenticated chat endpoint and render incoming chunks immediately.

This file is the parity contract so future changes to the primary Aurora agent are not silently omitted from the Baby Agent.
