/speckit.plan Lock the technical implementation around the following non-negotiable tools and a lean runtime stack.

NON-NEGOTIABLE PRODUCTION TOOLS (build-time only — never called at runtime)

- RFC content sourcing: the RFC MCP server. Every technical fact, definition, and citation that appears in the game must be retrieved via the RFC MCP server during development. Persist retrievals to a local citations manifest (citations.json) committed to the repo, keyed by scene → claim → RFC + section. No fact ships without an entry in that manifest.
- Still image assets (characters, backgrounds, UI illustrations, packet iconography): generated using Nano Banana (Gemini image generation) and/or OpenAI's image generation API. Both are allowed; document which is used where. All images generated from a shared style-guide prompt template defined in /assets/style-guide.md. Seeds and prompts logged per asset in /assets/manifest.json.
- Animated cutscenes (cinematics, success/failure beats, the boss finale): Veo 3. One cutscene per branch outcome. Pre-rendered to .mp4, bundled with the build. Prompts and seeds logged in /cutscenes/manifest.json.
- Voice-over and narration: OpenAI TTS. One voice ID per character, locked in /audio/voice-config.json. All lines pre-rendered to audio files at build time.

RUNTIME STACK

- HTML5 + vanilla JavaScript for the game shell. No heavyweight game engine.
- Vite for the dev server and build pipeline.
- A minimal scene-graph / state-machine module (hand-rolled, ~200 lines) to drive the cutscene → decision → branch loop. Reference XState patterns but do not pull in the dependency unless the hand-rolled version becomes unwieldy.
- Three.js only if a 3D effect is required for the boss finale; otherwise omit. Default is 2D video playback in <video> elements layered over a styled DOM/CSS UI.
- Node.js for the build-time asset pipeline scripts (one script per tool: gen-images.js, gen-cutscenes.js, gen-tts.js, fetch-rfc-citations.js).
- No backend. The game is fully static after build. Assets ship in /dist.

PROJECT LAYOUT

- /src — game runtime (HTML, CSS, JS, scene-graph module, input handler, video/audio playback)
- /content — scripts, dialog, decision graphs, citations.json
- /assets — generated stills, style-guide.md, manifest.json
- /cutscenes — generated .mp4 files, manifest.json
- /audio — generated TTS .mp3/.wav files, voice-config.json
- /scripts — build-time asset generation scripts (Node)
- /tests — unit tests for classification logic, citation verification, branch-graph completeness

KEY ARCHITECTURAL RULES

- The decision graph is a single declarative data file (/content/level-01.json) that lists every scene, every decision point, every branch, and the asset references for each outcome. The runtime is a generic interpreter over this file — no per-scene code.
- Asset generation scripts are idempotent: re-running with the same inputs (prompt + seed) skips regeneration. Changing a prompt forces a regen and updates the manifest.
- The RFC citations manifest is the gate: a pre-build check fails the build if any scene references a claim with no citation entry.
- No runtime API calls to OpenAI, Gemini, Veo, or the RFC MCP server. The shipped game is offline-playable.

TESTING APPROACH

- Vitest for unit tests.
- Tests cover: DSCP-to-class mapping, decision-graph reachability (every node terminal-reachable, every branch has assets), citation-manifest completeness, input-latency simulation.
- A "RFC truth test" suite that, given the citations manifest, re-fetches each cited section via the RFC MCP server in CI and diffs against the recorded text — flagging drift, never auto-updating.

ONE LEVEL FOR NOW
Build only "Rush Hour at Router 7." Architecture should accommodate additional levels (level-02.json, level-03.json, …) without runtime changes, but do not build them yet.

MAKE SURE YOU UPDATE THE GITIGNORE TO EXCLUDE THE INSTALLED GAME ONLY KEEP THE SOURCE FILES, ASSETS, CUTSCENES, AUDIO, AND CITATIONS MANIFEST. THE /dist FOLDER SHOULD BE BUILT LOCALLY BUT NOT COMMITTED.
