# Video Agent Skill Pack

- **HeyGen Avatar:** persistent face/voice identity; run before presenter video when identity is not established.
- **HeyGen Video:** new presenter-led video creation; not avatar setup or existing-video translation.
- **HeyGen Translate:** localize an existing source video while preserving presenter identity, voice and lip-sync.
- **Chengfeng 剪口播:** source transcription → mistake/silence detection → review → user-confirmed cut → post-cut retranscription → corrected subtitles.
- **Chengfeng 口播成片:** storyboard → timeline preview → configured ratio/animation → final MP4 → QA.
- **Ian Xiaohei SVG Motion:** semantic SVG + GSAP motion from a cognitive anchor; avoid automatic raster vectorization.
- **Chengfeng 自进化:** integrate reusable corrections into the relevant methodology section.

Preserve project memory and identity locks across skills. Chain workflows where required and exclude unrelated skills from video routing.

Derived from the user-supplied HeyGen and Chengfeng video skill packs.

## Multimodal Vision & Evidence
- Analyze user-supplied images, videos and documents before generation or editing.
- Extract observable subjects, actions, shot boundaries, camera language, lighting, wardrobe, props, on-screen text and continuity risks.
- Use DeepSeek V4.1 Flash for deep visual reasoning and GLM 5.3 Flash for multimodal continuity/tool-oriented review.
- Preserve uncertainty: observed facts outrank inferred intent.

## Multi-character Production
- Assign stable character IDs before generating multi-person scenes.
- Maintain face/appearance, wardrobe, props, spatial blocking, gaze, screen direction and interaction state across shots.
- Build character sheets and relationship/blocking maps before a complex scene.

## Layered Editing
- Treat V1+video, dialogue, music, SFX, captions, overlays, masks and transforms as independent reversible layers.
- Natural-language edits must resolve to layer + clip + time range.
- Regenerate only affected shots and preserve approved unaffected media.

## Image & Video Creation
- Image creation supports concept frames, character sheets, location sheets, keyframes and reference-conditioned images.
- Video creation supports text-to-video, image-to-video, reference-to-video, extension and targeted video editing.
- Seedance remains the video-generation/repair engine; vision models analyze the inputs and inspect results.
