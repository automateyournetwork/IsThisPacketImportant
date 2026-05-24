# Data Model: Is This Packet Important?

**Date**: 2026-05-24

## Overview

This document defines the data structures used in the game. All data is stored as JSON files
in the `/content/` directory. There is no database—the game is fully static after build.

## Core Entities

### Level

The top-level container for a complete game level.

| Field         | Type          | Description                                          |
| ------------- | ------------- | ---------------------------------------------------- |
| `id`          | string        | Unique level identifier (e.g., "rush-hour-router-7") |
| `name`        | string        | Display name for the level                           |
| `description` | string        | Brief level description                              |
| `scenes`      | Scene[]       | Ordered array of scenes in the level                 |
| `metadata`    | LevelMetadata | Level-wide settings and info                         |

### Scene

A single scene in the level, which may be a cutscene, decision point, or special event.

| Field                | Type             | Description                                   |
| -------------------- | ---------------- | --------------------------------------------- |
| `id`                 | string           | Unique scene identifier within the level      |
| `type`               | enum             | "intro" \| "decision" \| "boss" \| "debrief"  |
| `traffic`            | TrafficType?     | Traffic info (only for decision/boss types)   |
| `timer`              | TimerConfig?     | Timer settings (only for decision/boss types) |
| `assets`             | SceneAssets      | Video, audio, and image asset references      |
| `dialog`             | string           | Path to dialog JSON for this scene            |
| `citations`          | string[]         | Array of citation IDs used in this scene      |
| `unlockedCategories` | string[]         | DSCP categories available for this decision   |
| `firstUseTerms`      | TermDefinition[] | Terms introduced for the first time           |
| `next`               | NextScene        | Transition rules to subsequent scenes         |

### TrafficType

Describes the network traffic being classified.

| Field          | Type         | Description                                 |
| -------------- | ------------ | ------------------------------------------- |
| `id`           | string       | Unique traffic type identifier              |
| `name`         | string       | Display name (e.g., "VoIP Emergency Call")  |
| `description`  | string       | In-game description of the traffic          |
| `correctClass` | string       | Correct DiffServ class (e.g., "EF", "AF21") |
| `rfcReference` | RFCReference | RFC citation for this classification        |

### ServiceClass

A DiffServ service class definition.

| Field            | Type         | Description                                    |
| ---------------- | ------------ | ---------------------------------------------- |
| `id`             | string       | Class identifier (e.g., "EF", "AF11", "CS1")   |
| `name`           | string       | Full name (e.g., "Expedited Forwarding")       |
| `category`       | string       | Parent category (e.g., "EF", "AF", "CS", "BE") |
| `dscp`           | number       | DSCP value (0-63)                              |
| `dscpBinary`     | string       | Binary representation (6 bits)                 |
| `phbBehavior`    | string       | Brief PHB behavior description                 |
| `rfcReference`   | RFCReference | Primary RFC citation                           |
| `dropPrecedence` | number?      | For AF classes: 1 (low), 2 (medium), 3 (high)  |

### Citation

An RFC citation linking an in-game claim to authoritative source.

| Field          | Type   | Description                              |
| -------------- | ------ | ---------------------------------------- |
| `id`           | string | Unique citation identifier               |
| `claimText`    | string | The in-game text making the claim        |
| `rfc`          | number | RFC number                               |
| `section`      | string | Section identifier (e.g., "4.7", "2.1")  |
| `excerpt`      | string | Relevant excerpt from the RFC            |
| `verifiedAt`   | string | ISO timestamp of last verification       |
| `verifiedHash` | string | Hash of RFC content at verification time |

### Character

A voiced character in the game.

| Field           | Type         | Description                                 |
| --------------- | ------------ | ------------------------------------------- |
| `id`            | string       | Unique character identifier                 |
| `name`          | string       | Character display name                      |
| `role`          | string       | Role description (e.g., "Mentor", "Router") |
| `voiceProfile`  | VoiceProfile | TTS voice settings                          |
| `portraitAsset` | string       | Path to character portrait image            |

### VoiceProfile

OpenAI TTS voice configuration.

| Field     | Type    | Description                          |
| --------- | ------- | ------------------------------------ |
| `voiceId` | string  | OpenAI TTS voice identifier          |
| `speed`   | number  | Playback speed multiplier (0.25-4.0) |
| `style`   | string? | Optional style hint for generation   |

### PlayerProgress

Runtime state tracking player's progress (not persisted).

| Field                | Type             | Description                      |
| -------------------- | ---------------- | -------------------------------- |
| `currentSceneId`     | string           | Current scene identifier         |
| `decisions`          | DecisionRecord[] | History of player decisions      |
| `retryCount`         | number           | Total retries in current session |
| `startTime`          | number           | Session start timestamp          |
| `unlockedCategories` | Set<string>      | DSCP categories unlocked so far  |

### DecisionRecord

A single decision made by the player.

| Field           | Type    | Description                        |
| --------------- | ------- | ---------------------------------- |
| `sceneId`       | string  | Scene where decision was made      |
| `selectedClass` | string  | Class the player selected          |
| `correctClass`  | string  | The correct class                  |
| `isCorrect`     | boolean | Whether selection was correct      |
| `timestamp`     | number  | When the decision was made         |
| `timeRemaining` | number  | Seconds left on timer when decided |

## Supporting Types

### LevelMetadata

| Field               | Type   | Description                            |
| ------------------- | ------ | -------------------------------------- |
| `author`            | string | Level author/creator                   |
| `version`           | string | Level version                          |
| `estimatedDuration` | number | Expected play time in minutes          |
| `difficulty`        | string | "tutorial" \| "standard" \| "advanced" |

### TimerConfig

| Field       | Type   | Description                                       |
| ----------- | ------ | ------------------------------------------------- |
| `duration`  | number | Timer duration in seconds                         |
| `type`      | string | "tutorial" (8s) \| "standard" (5s) \| "boss" (3s) |
| `warningAt` | number | Seconds remaining to show warning                 |

### SceneAssets

| Field        | Type    | Description                   |
| ------------ | ------- | ----------------------------- |
| `intro`      | string? | Path to intro cutscene video  |
| `success`    | string? | Path to success outcome video |
| `failure`    | string? | Path to failure outcome video |
| `background` | string? | Path to background image      |
| `music`      | string? | Path to background music      |

### NextScene

| Field     | Type    | Description                               |
| --------- | ------- | ----------------------------------------- |
| `success` | string  | Scene ID to transition to on success      |
| `failure` | string  | Scene ID to transition to on failure      |
| `timeout` | string? | Scene ID on timeout (defaults to failure) |

### TermDefinition

| Field        | Type   | Description                         |
| ------------ | ------ | ----------------------------------- |
| `term`       | string | The term being defined (e.g., "EF") |
| `definition` | string | Brief definition text               |
| `citation`   | string | Citation ID for the definition      |

### RFCReference

| Field     | Type   | Description          |
| --------- | ------ | -------------------- |
| `rfc`     | number | RFC number           |
| `section` | string | Section identifier   |
| `title`   | string | Section or RFC title |

## Relationships

```
Level
  └── Scene[] ────────────────── Dialog JSON
        ├── TrafficType ──────── RFCReference
        │     └── correctClass → ServiceClass
        ├── Citation[] ───────── RFCReference
        ├── SceneAssets
        └── TermDefinition[]

ServiceClass ─────────────────── RFCReference

Character ────────────────────── VoiceProfile

PlayerProgress (runtime only)
  └── DecisionRecord[]
```

## File Locations

| Entity             | File Path                                                                   |
| ------------------ | --------------------------------------------------------------------------- |
| Level definition   | `/content/level-01.json`                                                    |
| DSCP classes       | `/content/dscp-classes.json`                                                |
| Citations manifest | `/content/citations.json`                                                   |
| Scene dialogs      | `/content/dialog/level-01/*.json`                                           |
| Voice profiles     | `/audio/voice-config.json`                                                  |
| Asset manifests    | `/assets/manifest.json`, `/cutscenes/manifest.json`, `/audio/manifest.json` |

## Validation Rules

1. **Unique IDs**: All `id` fields must be unique within their collection
2. **Valid References**: All `correctClass` values must exist in `dscp-classes.json`
3. **Citation Coverage**: Every scene with educational content must have corresponding citations
4. **Asset Completeness**: Every `success` and `failure` path must have a corresponding video file
5. **Graph Connectivity**: Every scene must be reachable from the level start
6. **Terminal Nodes**: The debrief scene must be reachable via success paths
