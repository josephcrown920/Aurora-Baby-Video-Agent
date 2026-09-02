# Aurora Baby Video Agent

A production-oriented autonomous video agent for reference-driven image/video generation, character continuity, shot planning, targeted repair, QA and multi-format delivery.

## Production loop

```text
Brief + character/reference assets
             ↓
        Project Memory
             ↓
       Agent planning
             ↓
 Characters / world / wardrobe / shots
             ↓
 Notebook + approved references
             ↓
 Capability-aware routing
             ↓
 ModelArk / fal / Replicate / Vast
             ↓
 Candidate inspection + continuity QA
             ↓
 Approve / lock / reject
             ↓
 Targeted regeneration
             ↓
 Slate / render / delivery
```

## Shared foundation

- `project-memory/core.ts` — persistent Context, Notebook, references, locks, approvals and continuity.
- `agent-core/production.ts` — normalized production requests, routing, scoring, acceptance gates and targeted edits.
- `agent-core/modelark.ts` — direct ModelArk backend with true SSE text streaming, Seedream image generation and Seedance video task generation/polling.

## ModelArk

```text
ARK_API_KEY=...
ARK_BASE_URL=https://ark.ap-southeast.bytepluses.com/api/v3
MODELARK_TEXT_MODEL=<active text model or endpoint>
MODELARK_IMAGE_MODEL=<active Seedream model or endpoint>
MODELARK_VIDEO_MODEL=<active Seedance model or endpoint>
```

Keys remain server-side. Model IDs remain configurable for account/region-specific activation.

## Streaming

Text responses use native SSE when ModelArk is selected. Render deltas immediately and finalize on `[DONE]`. Media jobs expose real progress events such as `planning`, `routing`, `generating`, `inspecting`, `revising`, `rendering`, `completed`, `retrying` and `failed`.

## Baby-agent continuity rules

Identity, face, body, hair, wardrobe, environment, style, props, start-frame and end-frame references should be represented as explicit project constraints. A failed generation must not erase approved references. Regeneration should preserve every unaffected lock.

## Skills

Video-relevant supplied skills include HeyGen Avatar, HeyGen Video, HeyGen Translate, Chengfeng 剪口播, Chengfeng 口播成片, Ian Xiaohei SVG Motion and Chengfeng 自进化. Unrelated skills are excluded from routing.

## Acceptance

Production completeness requires a domain contract, API/workflow, UI entry where needed, provider/worker boundary, observable status, failure path, revision path, persisted approvals and verifiable output.

## Development

```bash
npm install
npx tsc --noEmit
npm run build
```

## Production boundary

Live generation still requires valid provider credentials, activated models, storage, queues/workers and render infrastructure.

## Aurora Global

The same project-memory, production, ModelArk and skill improvements are propagated into Aurora Global's video-agent surfaces and exports.
