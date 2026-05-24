# Implementation Plan: Is This Packet Important? - Rush Hour at Router 7

**Branch**: `002-packet-classification-dscp` | **Date**: 2026-05-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-packet-classification-dscp/spec.md`

## Summary

Build a Dragon's Lair-style educational game teaching DiffServ packet classification through
cinematic vignettes and quick-time decision events. The game presents six traffic scenarios
where players classify packets using RFC 4594 guidelines. Technical approach: static HTML5/JS
game with pre-rendered video cutscenes, build-time AI asset generation, and a declarative
decision graph interpreter.

## Technical Context

**Language/Version**: JavaScript ES2022+ (runtime), Node.js 20+ (build scripts)
**Primary Dependencies**: Vite (build/dev), Vitest (testing), vanilla JS (no framework)
**Storage**: N/A (fully static, no backend)
**Testing**: Vitest for unit tests, custom RFC verification tests
**Target Platform**: Desktop browsers (Chrome, Firefox, Safari, Edge), offline-capable after build
**Project Type**: Static web game (HTML5 + video + audio assets)
**Performance Goals**: <3s first frame, <50ms input latency, 60fps UI, stutter-free video
**Constraints**: <1GB total assets, no runtime API calls, MP4/H.264 video at 1920x1080
**Scale/Scope**: Single level ("Rush Hour at Router 7"), 6 vignettes + boss event, ~15 min playtime

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                   | Requirement                            | Status                                                                  |
| --------------------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| **I. Code Quality**         | Content/presentation separation        | ✅ Decision graph is declarative JSON, runtime is generic interpreter   |
| **I. Code Quality**         | Single source of truth for DSCP values | ✅ `/content/dscp-classes.json` referenced everywhere                   |
| **I. Code Quality**         | No magic numbers                       | ✅ All DSCP values resolve through named constants with RFC citations   |
| **I. Code Quality**         | Pure classification functions          | ✅ Classification logic in `/src/lib/classifier.js`, no side effects    |
| **I. Code Quality**         | Linting enforced                       | ✅ ESLint + Prettier on commit hooks                                    |
| **II. Testing**             | Unit tests for classification rules    | ✅ Vitest tests assert against RFC 4594                                 |
| **II. Testing**             | RFC citation verification              | ✅ Automated test fetches cited sections via RFC MCP server             |
| **II. Testing**             | Deterministic input tests              | ✅ Input handler tests with mocked timestamps                           |
| **II. Testing**             | Golden-file tests                      | ✅ Asset manifest includes checksums; regeneration diffs against golden |
| **II. Testing**             | Branch coverage test                   | ✅ Graph walker confirms all nodes have success/failure assets          |
| **III. UX Consistency**     | Visual style guide                     | ✅ `/assets/style-guide.md` defines all generation prompts              |
| **III. UX Consistency**     | Voice profiles locked                  | ✅ `/audio/voice-config.json` per character                             |
| **III. UX Consistency**     | QTE affordances consistent             | ✅ Single component, same position/timing across scenes                 |
| **III. UX Consistency**     | Term introduction                      | ✅ First-use definitions in decision graph with RFC citations           |
| **III. UX Consistency**     | Subtitles default on                   | ✅ Subtitle track enabled by default, toggle in UI                      |
| **IV. Performance**         | <3s first frame                        | ✅ Preload critical assets, lazy-load non-essential                     |
| **IV. Performance**         | No video stutter                       | ✅ Pre-rendered MP4/H.264, hardware-accelerated playback                |
| **IV. Performance**         | <50ms input latency                    | ✅ Direct event handlers, no framework overhead                         |
| **IV. Performance**         | <1GB memory                            | ✅ Asset budget tracked in manifest                                     |
| **IV. Performance**         | Build-time generation                  | ✅ All AI calls in `/scripts/`, none in `/src/`                         |
| **V. Educational Accuracy** | RFC-sourced claims                     | ✅ `citations.json` manifest required for build                         |
| **V. Educational Accuracy** | No inference                           | ✅ Build fails if claim lacks citation entry                            |
| **V. Educational Accuracy** | Reviewer pass                          | ✅ Pre-commit hook checks citation coverage                             |

**Gate Status**: ✅ PASS - All constitutional requirements satisfied by design.

## Project Structure

### Documentation (this feature)

```text
specs/002-packet-classification-dscp/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (decision graph schema, asset manifests)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── index.html           # Entry point
├── main.js              # App bootstrap, scene loader
├── styles/
│   └── main.css         # Game UI styles
├── lib/
│   ├── scene-graph.js   # State machine driving cutscene → decision → branch loop
│   ├── classifier.js    # Pure functions: DSCP classification logic
│   ├── input-handler.js # Keyboard + gamepad input with debouncing
│   ├── video-player.js  # <video> element wrapper with preloading
│   ├── audio-player.js  # TTS/SFX playback manager
│   └── timer.js         # Decision countdown with variable durations
├── components/
│   ├── decision-ui.js   # QTE prompt, category selector, timer display
│   ├── subtitle.js      # Subtitle overlay component
│   ├── citation.js      # RFC citation toggle and display
│   └── debrief.js       # Post-level summary screen
└── data/
    └── loader.js        # Loads level JSON and resolves asset paths

content/
├── level-01.json        # Decision graph for "Rush Hour at Router 7"
├── dscp-classes.json    # Single source of truth for all DSCP/PHB mappings
├── citations.json       # RFC citation manifest (scene → claim → RFC + section)
└── dialog/
    └── level-01/        # Dialog scripts per scene (for TTS generation)

assets/
├── style-guide.md       # Visual style template for all image generation
├── manifest.json        # Image asset registry (prompt, seed, path, checksum)
└── images/
    ├── characters/      # Character portraits and sprites
    ├── backgrounds/     # Scene backgrounds
    ├── ui/              # UI elements, icons, packet graphics
    └── packets/         # Packet type illustrations

cutscenes/
├── manifest.json        # Video asset registry (prompt, seed, path, checksum)
└── level-01/
    ├── intro.mp4
    ├── vignette-01-success.mp4
    ├── vignette-01-failure.mp4
    └── ... (all scene videos)

audio/
├── voice-config.json    # Character voice profiles (voice ID, speed, style)
├── manifest.json        # Audio asset registry
└── voice/
    └── level-01/        # TTS audio files per scene/character

scripts/
├── gen-images.js        # Nano Banana / OpenAI image generation
├── gen-cutscenes.js     # Veo3 video generation
├── gen-tts.js           # OpenAI TTS generation
├── fetch-rfc-citations.js # RFC MCP server citation fetcher
└── verify-citations.js  # Citation verification for CI

tests/
├── unit/
│   ├── classifier.test.js      # DSCP classification logic tests
│   ├── scene-graph.test.js     # State machine tests
│   └── input-handler.test.js   # Input timing tests
├── integration/
│   ├── level-graph.test.js     # Branch coverage / asset completeness
│   └── citation-verify.test.js # RFC citation existence verification
└── golden/
    └── asset-checksums.json    # Golden file checksums for regeneration tests

dist/                    # Build output (gitignored)
```

**Structure Decision**: Custom static game structure optimized for cinematic video playback
with declarative decision graph. No framework to minimize bundle size and input latency.
Build-time scripts separated from runtime code per constitution requirements.

## Complexity Tracking

> No violations identified. All requirements satisfied with minimal architecture.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _None_    | —          | —                                    |
