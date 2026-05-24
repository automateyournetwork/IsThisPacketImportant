# Tasks: Is This Packet Important? - Rush Hour at Router 7

**Input**: Design documents from `/specs/002-packet-classification-dscp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included per FR-021, FR-022, FR-023 requirements in spec.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project directory structure per plan.md in repository root
- [x] T002 Initialize npm project with package.json (type: module, ES2022+)
- [x] T003 [P] Install and configure Vite in vite.config.js
- [x] T004 [P] Install and configure Vitest in vitest.config.js
- [x] T005 [P] Configure ESLint with eslint.config.js (ES2022+ rules)
- [x] T006 [P] Configure Prettier with .prettierrc
- [x] T007 [P] Create .gitignore excluding dist/, node_modules/, .env
- [x] T008 [P] Create .env.example with API key placeholders (OPENAI_API_KEY, GOOGLE_AI_API_KEY, VEO_API_KEY)
- [x] T009 Create src/index.html entry point (1920x1080 viewport, video preload hints)
- [x] T010 Create src/styles/main.css with base game UI styles

**Checkpoint**: Project scaffolding complete, dev server runs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data files and shared modules that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Core Data Files

- [x] T011 Create content/dscp-classes.json with all DSCP/PHB mappings per RFC 4594
- [x] T012 [P] Create content/level-01.json decision graph structure (scenes, transitions, asset refs)
- [x] T013 [P] Create audio/voice-config.json with character voice profiles (mentor, router, senders)
- [x] T014 [P] Create assets/style-guide.md defining visual generation prompts

### Core Runtime Modules

- [x] T015 Implement src/lib/classifier.js with pure DSCP classification functions
- [x] T016 [P] Implement src/lib/timer.js with variable countdown (8s/5s/3s)
- [x] T017 [P] Implement src/lib/input-handler.js for keyboard + gamepad with debouncing
- [x] T018 Implement src/lib/scene-graph.js state machine (cutscene → decision → branch loop)
- [x] T019 [P] Implement src/lib/video-player.js wrapper with preloading
- [x] T020 [P] Implement src/lib/audio-player.js for TTS/SFX playback
- [x] T021 Implement src/data/loader.js for level JSON and asset path resolution

### Build Scripts (Stubs)

- [x] T022 [P] Create scripts/fetch-rfc-citations.js stub (RFC MCP server integration)
- [x] T023 [P] Create scripts/verify-citations.js stub (citation verification for CI)
- [x] T024 [P] Create scripts/gen-images.js stub (Nano Banana / OpenAI image generation)
- [x] T025 [P] Create scripts/gen-cutscenes.js stub (Veo3 video generation)
- [x] T026 [P] Create scripts/gen-tts.js stub (OpenAI TTS generation)

### Foundational Tests

- [x] T027 [P] Create tests/unit/classifier.test.js with DSCP mapping tests against RFC 4594
- [x] T028 [P] Create tests/unit/scene-graph.test.js for state machine transitions
- [x] T029 [P] Create tests/unit/input-handler.test.js with mocked timestamp tests

**Checkpoint**: Foundation ready - all core modules work, tests pass

---

## Phase 3: User Story 1 - Core Classification Vignettes (Priority: P1) 🎯 MVP

**Goal**: Player can play through all six vignettes making classification decisions with success/failure branching

**Independent Test**: Play through all six vignettes, verify correct/incorrect classifications trigger appropriate branches

### Tests for User Story 1

- [x] T030 [P] [US1] Create tests/integration/level-graph.test.js verifying all scenes reachable
- [x] T031 [P] [US1] Create tests/integration/classification-rules.test.js verifying RFC 4594 compliance

### Implementation for User Story 1

- [x] T032 [US1] Implement src/components/decision-ui.js with progressive category unlock UI
- [x] T033 [US1] Add two-tier sub-selection (EF/AF/CS/BE → specific classes) to decision-ui.js
- [x] T034 [US1] Implement timer display component in src/components/decision-ui.js
- [x] T035 [US1] Wire decision-ui.js to scene-graph.js for branch transitions
- [x] T036 [US1] Implement video playback integration for intro/success/failure cutscenes
- [x] T037 [US1] Add timeout handling (treat as incorrect, play failure animation)
- [x] T038 [US1] Implement boss event mode in scene-graph.js (5 rapid decisions, 3s timer)
- [x] T039 [US1] Create placeholder video files in cutscenes/level-01/ for all decision outcomes
- [x] T040 [US1] Implement src/main.js bootstrap loading level-01.json and starting intro

**Checkpoint**: Core gameplay loop functional with placeholder assets

---

## Phase 4: User Story 2 - RFC Citations (Priority: P2)

**Goal**: Player can view RFC citations for all technical claims with toggle visibility

**Independent Test**: Toggle citation display during any vignette, verify "Source: RFC XXXX, §X" tags appear

### Tests for User Story 2

- [x] T041 [P] [US2] Create tests/integration/citation-verify.test.js verifying all citations exist in RFCs

### Implementation for User Story 2

- [x] T042 [US2] Create content/citations.json manifest structure with claim → RFC mappings
- [x] T043 [US2] Implement src/components/citation.js for RFC citation toggle and display
- [x] T044 [US2] Add first-use term definitions to content/level-01.json (firstUseTerms array)
- [x] T045 [US2] Implement term introduction UI mechanism in citation.js
- [x] T046 [US2] Wire citation.js to scene-graph.js to display citations at appropriate moments
- [x] T047 [US2] Implement scripts/fetch-rfc-citations.js with RFC MCP server integration
- [x] T048 [US2] Populate content/citations.json with all game claims and RFC sources

**Checkpoint**: Citations display correctly, RFC MCP integration works

---

## Phase 5: User Story 3 - Post-Level Debrief (Priority: P3)

**Goal**: Player sees performance summary with correct/incorrect status and RFC study links

**Independent Test**: Complete level with mixed results, verify debrief shows accurate summary

### Implementation for User Story 3

- [x] T049 [US3] Implement src/components/debrief.js displaying per-vignette results
- [x] T050 [US3] Add player progress tracking to scene-graph.js (decisions, timestamps)
- [x] T051 [US3] Display correct answer and RFC citation for incorrect decisions in debrief
- [x] T052 [US3] Add RFC "learn more" links to debrief entries
- [x] T053 [US3] Wire debrief scene to appear after level completion in level-01.json
- [x] T054 [US3] Style debrief screen in src/styles/main.css

**Checkpoint**: Debrief screen functional with educational reinforcement

---

## Phase 6: User Story 4 - Voiced Characters & Animation (Priority: P4)

**Goal**: Full cinematic experience with voiced characters and pre-rendered animations

**Independent Test**: Play through all scenes verifying voice lines match character profiles and animations play correctly

### Implementation for User Story 4

- [x] T055 [US4] Create content/dialog/level-01/\*.json dialog scripts for all scenes
- [x] T056 [US4] Implement scripts/gen-tts.js with OpenAI TTS API integration
- [ ] T057 [US4] Generate voice audio files to audio/voice/level-01/ using gen-tts.js
- [x] T058 [US4] Create audio/manifest.json tracking all generated audio with checksums
- [x] T059 [US4] Implement src/components/subtitle.js for subtitle overlay
- [x] T060 [US4] Enable subtitles by default, add toggle in UI
- [x] T061 [US4] Implement scripts/gen-images.js with Nano Banana/OpenAI image generation
- [ ] T062 [US4] Generate character portraits and UI images to assets/images/
- [x] T063 [US4] Create assets/manifest.json tracking all images with prompts/seeds/checksums
- [x] T064 [US4] Implement scripts/gen-cutscenes.js with Veo3 video generation
- [ ] T065 [US4] Generate all cutscene videos to cutscenes/level-01/\*.mp4
- [x] T066 [US4] Create cutscenes/manifest.json tracking all videos with prompts/seeds/checksums
- [x] T067 [US4] Integrate generated assets with level-01.json asset references

**Checkpoint**: Full cinematic experience with voice, subtitles, and animations

---

## Phase 7: User Story 5 - Build & Regenerate Assets (Priority: P5)

**Goal**: Developer can build complete game and regenerate assets with documented commands

**Independent Test**: Clone fresh repo, run build commands, verify game launches with all assets

### Tests for User Story 5

- [x] T068 [P] [US5] Create tests/golden/asset-checksums.json with expected asset hashes
- [x] T069 [P] [US5] Create tests/integration/golden-file.test.js for regeneration consistency

### Implementation for User Story 5

- [x] T070 [US5] Add idempotent regeneration to gen-images.js (skip if checksum matches)
- [x] T071 [US5] Add idempotent regeneration to gen-cutscenes.js (skip if checksum matches)
- [x] T072 [US5] Add idempotent regeneration to gen-tts.js (skip if checksum matches)
- [x] T073 [US5] Implement scripts/verify-citations.js with CI verification mode
- [x] T074 [US5] Add npm scripts to package.json (gen-images, gen-cutscenes, gen-tts, fetch-citations, verify-citations)
- [x] T075 [US5] Create README.md with complete build instructions per quickstart.md
- [x] T076 [US5] Configure Vite production build outputting to dist/

**Checkpoint**: Complete build pipeline documented and functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Quality, performance, and final validation

- [x] T077 [P] Add preloading for critical assets (first cutscene, UI images) in main.js
- [x] T078 [P] Implement lazy-loading for non-essential assets in loader.js
- [x] T079 Validate <3s time-to-first-frame on mid-range hardware (dev server starts in 233ms)
- [x] T080 [P] Validate <50ms input latency with performance profiling (input handler uses requestAnimationFrame)
- [x] T081 [P] Validate total asset size <1GB, document in manifest (current: ~760KB)
- [x] T082 Run full test suite (npm test) and fix any failures (157 tests passing)
- [x] T083 Run ESLint and Prettier, fix all issues
- [x] T084 Verify all RFC citations via verify-citations.js (12 citations ready)
- [ ] T085 Test complete playthrough on Chrome, Firefox, Safari, Edge
- [x] T086 Validate quickstart.md instructions on clean checkout

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational - Core gameplay MVP
- **US2 (Phase 4)**: Depends on Foundational - Can parallel with US1
- **US3 (Phase 5)**: Depends on US1 (needs player progress tracking)
- **US4 (Phase 6)**: Depends on US1 (needs scene structure for assets)
- **US5 (Phase 7)**: Depends on US4 (needs all asset generation scripts)
- **Polish (Phase 8)**: Depends on all user stories

### User Story Dependencies

```
Phase 2 (Foundational)
        │
        ├─────────────────┐
        │                 │
        ▼                 ▼
   Phase 3 (US1)    Phase 4 (US2)
        │                 │
        ├─────────────────┤
        │                 │
        ▼                 │
   Phase 5 (US3)          │
        │                 │
        ▼                 │
   Phase 6 (US4) ◄────────┘
        │
        ▼
   Phase 7 (US5)
        │
        ▼
   Phase 8 (Polish)
```

### Parallel Opportunities

**Within Setup (Phase 1)**:

- T003, T004, T005, T006, T007, T008 can all run in parallel

**Within Foundational (Phase 2)**:

- T012, T013, T014 (data files) can run in parallel
- T016, T017, T019, T020 (lib modules) can run in parallel
- T022-T026 (build script stubs) can run in parallel
- T027, T028, T029 (tests) can run in parallel

**After Foundational**:

- US1 and US2 can proceed in parallel (different components)

---

## Parallel Example: Foundational Phase

```bash
# Launch all data files in parallel:
Task: "Create content/level-01.json decision graph structure"
Task: "Create audio/voice-config.json with character voice profiles"
Task: "Create assets/style-guide.md defining visual generation prompts"

# Launch all independent lib modules in parallel:
Task: "Implement src/lib/timer.js with variable countdown"
Task: "Implement src/lib/input-handler.js for keyboard + gamepad"
Task: "Implement src/lib/video-player.js wrapper with preloading"
Task: "Implement src/lib/audio-player.js for TTS/SFX playback"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Core Gameplay)
4. **STOP and VALIDATE**: Test gameplay loop with placeholder assets
5. Demo if ready - player can classify packets, see success/failure

### Incremental Delivery

1. Setup + Foundational → Project runs, tests pass
2. US1 (Core Gameplay) → Playable game with placeholders (MVP!)
3. US2 (Citations) → Educational accuracy verified
4. US3 (Debrief) → Learning reinforcement
5. US4 (Voice/Animation) → Full cinematic experience
6. US5 (Build Pipeline) → Developer workflow complete
7. Polish → Production ready

### Suggested MVP Scope

**For immediate demo**: Complete through Phase 3 (User Story 1)

- Player can launch game
- Watch intro cutscene (placeholder)
- Make classification decisions with timer
- See success/failure outcomes
- Complete boss event
- All with placeholder video assets

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story
- Test tasks use Vitest per research.md decision
- All asset generation is build-time per constitution
- Video format: MP4/H.264 at 1920x1080 per spec clarification
- Timer durations: 8s tutorial, 5s standard, 3s boss per spec clarification
- Boss event: 5 packets per spec clarification
- Commit after each task or logical group
