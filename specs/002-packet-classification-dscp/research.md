# Research: Is This Packet Important? - Rush Hour at Router 7

**Date**: 2026-05-24
**Status**: Complete

## Technology Decisions

### Runtime Stack

**Decision**: HTML5 + Vanilla JavaScript with Vite

**Rationale**:

- No framework overhead maximizes input latency performance (<50ms requirement)
- Native `<video>` elements provide hardware-accelerated MP4/H.264 playback
- Vite offers fast dev server hot-reload and optimized production builds
- Static output enables offline play after build (no backend required)

**Alternatives Considered**:

- **React/Vue/Svelte**: Rejected due to framework overhead impacting input latency and bundle size
- **Game engines (Phaser, PixiJS)**: Rejected as overkill for video playback + DOM UI; would add complexity without benefit
- **Three.js**: Reserved only if 3D effects needed for boss finale; default is 2D video + CSS

### State Management

**Decision**: Hand-rolled scene-graph state machine (~200 lines)

**Rationale**:

- Simple cutscene → decision → branch loop doesn't require complex state library
- XState-inspired patterns provide structure without dependency
- Direct control over transition timing critical for QTE input windows

**Alternatives Considered**:

- **XState**: Considered but adds 15KB+ to bundle; patterns sufficient without library
- **Redux/Zustand**: Overkill for single-level game with no persistence

### Build-Time Asset Generation

**Decision**: Node.js scripts calling external APIs

| Asset Type      | Tool                                | Output                            |
| --------------- | ----------------------------------- | --------------------------------- |
| Still images    | Nano Banana (Gemini) / OpenAI Image | PNG/JPG in `/assets/images/`      |
| Cutscene videos | Veo3                                | MP4/H.264 in `/cutscenes/`        |
| Voice-over      | OpenAI TTS                          | MP3/WAV in `/audio/voice/`        |
| RFC citations   | RFC MCP Server                      | JSON in `/content/citations.json` |

**Rationale**:

- All generation at build time per constitution (no runtime API calls)
- Idempotent scripts with prompt+seed logging enable reproducible regeneration
- Manifest files track checksums for golden-file testing

**Alternatives Considered**:

- **Runtime generation**: Forbidden by constitution (offline-capable requirement)
- **Manual asset creation**: Not feasible for cinematic quality at scale

### Testing Framework

**Decision**: Vitest

**Rationale**:

- Native ESM support matches project structure
- Fast execution with watch mode for development
- Compatible with Vite toolchain

**Alternatives Considered**:

- **Jest**: Requires additional ESM configuration
- **Playwright**: Reserved for potential E2E tests; Vitest handles unit/integration

## RFC Research

### Primary Classification Reference

**RFC 4594**: Configuration Guidelines for DiffServ Service Classes

Key sections for game content:

- Section 2: Service Class Definitions (maps traffic types to PHBs)
- Section 4.1-4.12: Individual service class specifications
- Table 3: DSCP to Service Class mapping

### Supporting RFCs

| RFC      | Purpose               | Key Sections                                          |
| -------- | --------------------- | ----------------------------------------------------- |
| RFC 2474 | DSCP field definition | Section 3 (DS Field), Section 4 (DSCP)                |
| RFC 2475 | DiffServ architecture | Section 2 (Terminology), Section 4 (Components)       |
| RFC 2597 | AF PHB definitions    | Section 2 (AF PHB Group), Section 3 (Drop Precedence) |
| RFC 3246 | EF PHB definition     | Section 2 (EF PHB), Section 3 (Behavior)              |

### Traffic Type to Service Class Mapping

Based on RFC 4594 Section 2 and Table 3:

| Game Vignette     | Traffic Type           | Service Class | DSCP        | RFC 4594 Section |
| ----------------- | ---------------------- | ------------- | ----------- | ---------------- |
| VoIP Emergency    | Telephony              | EF            | 46 (101110) | 4.7              |
| Live Video Stream | Real-Time Interactive  | CS4 or AF41   | 32/34       | 4.6              |
| Bulk File Backup  | High-Throughput Data   | AF11          | 10          | 4.8              |
| Routine Email     | Standard               | Default (BE)  | 0           | 4.12             |
| Background Flood  | Low-Priority Data      | CS1           | 8           | 4.10             |
| Boss Event        | Mixed (rapid sequence) | Various       | Various     | Multiple         |

**Note**: All mappings will be verified via RFC MCP server during implementation and recorded
in `citations.json` with exact section references.

## Architecture Patterns

### Decision Graph Schema

The level is defined as a declarative JSON structure:

```json
{
  "level": "rush-hour-router-7",
  "scenes": [
    {
      "id": "vignette-01",
      "type": "decision",
      "traffic": { "type": "voip-emergency", "correctClass": "EF" },
      "timer": { "duration": 8, "type": "tutorial" },
      "assets": {
        "intro": "cutscenes/level-01/v01-intro.mp4",
        "success": "cutscenes/level-01/v01-success.mp4",
        "failure": "cutscenes/level-01/v01-failure.mp4"
      },
      "dialog": "content/dialog/level-01/v01.json",
      "citations": ["claim-01", "claim-02"],
      "next": { "success": "vignette-02", "failure": "vignette-01" }
    }
  ]
}
```

**Rationale**: Runtime is a generic interpreter over this data. Adding new levels or modifying
existing content requires no code changes—only JSON and assets.

### Input Handling Pattern

```
KeyDown/GamepadButton → Event Handler → State Check → Branch Transition
         ↓                    ↓              ↓              ↓
     Debounce            Valid Window?    Lock Input    Trigger Video
      (50ms)              (timer > 0)     Until Done    Play + Advance
```

**Rationale**: Direct event handlers (no framework) ensure <50ms latency requirement.
Input locked during transitions to prevent double-fires.

### Citation Verification Flow

```
Build Time:
  1. fetch-rfc-citations.js reads content/*.json for citation references
  2. For each reference, calls RFC MCP server to fetch section text
  3. Records RFC number, section, and snippet in citations.json
  4. Build fails if any reference cannot be verified

CI Time:
  1. verify-citations.js re-fetches all cited sections
  2. Diffs against recorded text in citations.json
  3. Flags drift (RFC updated) but never auto-updates
  4. Human review required for any changes
```

**Rationale**: Ensures educational accuracy (constitution Principle V) while preventing
silent RFC drift from corrupting game content.

## Open Questions Resolved

| Question            | Resolution                                                            |
| ------------------- | --------------------------------------------------------------------- |
| Timer durations     | 8s tutorial, 5s standard, 3s boss (from spec clarification)           |
| Boss packet count   | 5 packets in rapid succession (from spec clarification)               |
| Option presentation | Progressive unlock + two-tier sub-selection (from spec clarification) |
| Video format        | MP4/H.264 at 1920x1080 (from spec clarification)                      |
| Framework choice    | None (vanilla JS) per performance requirements                        |
| State library       | Hand-rolled scene-graph per simplicity principle                      |

## Next Steps

1. Generate `data-model.md` with entity definitions
2. Generate `contracts/` with JSON schemas for decision graph and manifests
3. Generate `quickstart.md` with build and run instructions
