# <!--

# SYNC IMPACT REPORT

Version Change: N/A → 1.0.0 (initial ratification)
Modified Principles: N/A (initial version)
Added Sections:

- Core Principles (5 pillars):
  - I. Code Quality
  - II. Testing Standards
  - III. UX Consistency
  - IV. Performance
  - V. Educational Accuracy (NON-NEGOTIABLE)
- RFC Compliance section
- AI Asset Pipeline section
- Governance
  Removed Sections: N/A (initial version)
  Templates Requiring Updates:
- .specify/templates/plan-template.md ✅ (Constitution Check section compatible)
- .specify/templates/spec-template.md ✅ (Requirements section compatible)
- .specify/templates/tasks-template.md ✅ (Test-first workflow compatible)
  Follow-up TODOs: None
  =============================================================================
  -->

# Is This Packet Important? Constitution

## Core Principles

### I. Code Quality

Strict separation between content and presentation is mandatory. RFC-derived facts, dialog,
and classification logic MUST be addressable as data, never hardcoded into render loops.

- **Single Source of Truth**: One lookup module for every DSCP value, PHB class, and
  traffic-class definition, referenced everywhere.
- **No Magic Numbers**: DSCP code points, drop precedences, and queue priorities MUST resolve
  through named constants traceable to a specific RFC section.
- **Pure Functions**: All packet-classification decision logic MUST be implemented as pure
  functions testable without the game loop running.
- **Enforced Standards**: Linting and formatting enforced on every commit; no merging with
  warnings.

### II. Testing Standards

Every classification rule, PHB mapping, and branching cutscene decision MUST have a unit test
asserting it matches the cited RFC.

- **RFC Citation Verification**: Each RFC-derived fact in dialog or on-screen text MUST carry
  an inline citation (RFC number + section) in the source, verified by an automated test that
  the citation exists in the referenced RFC.
- **Deterministic Input Tests**: Quick-time-event input handling MUST have deterministic tests:
  given input X at time T, branch Y is taken.
- **Golden-File Tests**: Regenerating an image, voice line, or cutscene with the same prompt
  and seed MUST NOT silently change what ships.
- **Branch Coverage**: A "no broken cutscene path" test MUST walk every branch in the level
  graph and confirm each terminal node has both a correct-path and failure-path asset.

### III. UX Consistency

One visual style guide governs all generated art assets (palette, line weight, character
proportions, lighting direction) documented as a prompt template; every image-generation call
composes from that template.

- **Voice Profiles**: One voice profile per character via OpenAI TTS—voice ID, speed, and
  style locked in a config file, never overridden ad-hoc.
- **QTE Affordances**: Quick-time-event affordances are consistent: same input prompt graphic,
  same on-screen position, same lead time before the decision window closes, every scene.
- **Term Introduction**: All RFC terminology MUST be introduced before use. First appearance
  of "EF," "AF41," "DSCP," etc. is accompanied by a short, RFC-cited definition surfaced
  through the same UI mechanism every time.
- **Accessibility**: Subtitles always on by default; audio is never the sole channel for
  educational content.

### IV. Performance

- **Time-to-First-Frame**: Opening cutscene MUST render first frame under 3 seconds on a
  mid-range laptop.
- **Playback Quality**: Cutscene video playback MUST NOT stutter; assets pre-rendered and
  bundled, not generated at runtime.
- **Input Latency**: Decision input latency MUST be under 50ms from key press to branch
  transition starting.
- **Memory Budget**: Memory footprint of the single level MUST be under 1 GB including all
  video, audio, and image assets.
- **Build-Time Generation**: All AI-generated assets (images, video, TTS audio) MUST be
  produced at build time and cached on disk—runtime MUST NOT call Veo3, Nano Banana, OpenAI
  image, or OpenAI TTS APIs.

### V. Educational Accuracy (NON-NEGOTIABLE)

This pillar is the foundational principle of the project. All other principles serve this one.

- **RFC-Sourced Claims**: Every technical claim in the game MUST be sourced from an RFC
  retrieved via the RFC MCP server during development, with the RFC + section recorded in a
  citations manifest committed to the repo.
- **No Inference**: If the RFC MCP server cannot confirm a claim, the claim is cut—no
  inferring, no "close enough," no filler from model priors.
- **Reviewer Pass**: Before shipping each scene, a reviewer MUST read the scene's script
  against its cited RFC sections; mismatch blocks the scene.

## RFC Compliance

This project is grounded in the DiffServ RFC family:

| RFC      | Title                                                 | Role                             |
| -------- | ----------------------------------------------------- | -------------------------------- |
| RFC 4594 | Configuration Guidelines for DiffServ Service Classes | Primary classification reference |
| RFC 2474 | Definition of the Differentiated Services Field       | DSCP field definition            |
| RFC 2475 | Architecture for Differentiated Services              | DiffServ architecture            |
| RFC 2597 | Assured Forwarding PHB Group                          | AF PHB definitions               |
| RFC 3246 | An Expedited Forwarding PHB                           | EF PHB definition                |

All packet classification logic, DSCP mappings, and PHB behavior MUST align with these RFCs.
Citations MUST reference specific section numbers.

## AI Asset Pipeline

All AI-generated content follows a strict build-time pipeline:

1. **Image Generation**: Veo3/Nano Banana calls at build time only; outputs cached to
   `assets/images/`
2. **Voice Synthesis**: OpenAI TTS calls at build time only; outputs cached to
   `assets/audio/voice/`
3. **Video Composition**: Pre-rendered at build time; outputs cached to `assets/video/`

Runtime code MUST load only from cache. API calls at runtime are forbidden.

## Governance

This Constitution supersedes all other development practices for "Is This Packet Important?"
and serves as the authoritative reference for architectural and implementation decisions.

**Amendment Process**:

1. Proposed amendments MUST be documented with rationale
2. Amendments affecting Educational Accuracy (Principle V) require explicit RFC verification
3. All amendments MUST include a migration plan for existing code
4. Version increments follow semantic versioning:
   - MAJOR: Principle removal or backward-incompatible redefinition
   - MINOR: New principle or material expansion
   - PATCH: Clarification, wording, or non-semantic changes

**Compliance Review**:

- All PRs MUST verify compliance with these principles
- Constitution Check gate in plan.md MUST pass before implementation begins
- Complexity deviations MUST be justified in the Complexity Tracking table

**Version**: 1.0.0 | **Ratified**: 2026-05-24 | **Last Amended**: 2026-05-24
