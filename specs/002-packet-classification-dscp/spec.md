# Feature Specification: Is This Packet Important? - Rush Hour at Router 7

**Feature Branch**: `002-packet-classification-dscp`
**Created**: 2026-05-24
**Status**: Draft
**Input**: Build a Dragon's Lair style educational game teaching DiffServ packet classification

## Clarifications

### Session 2026-05-24

- Q: How long should the decision timer be? → A: Variable (shorter in boss event, longer in tutorials)
- Q: How many packets in the boss congestion event? → A: 5 packets
- Q: How should classification options be presented? → A: Progressive category unlock with sub-selection (start with fewer categories, unlock more as player learns; each category expands to specific classes)
- Q: What is the target display resolution? → A: 1920x1080 (1080p, 16:9 aspect ratio)
- Q: What video format for cutscene assets? → A: MP4/H.264

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Play Through Core Classification Vignettes (Priority: P1)

A player launches the game and experiences a sequence of cinematic vignettes, each presenting
a different type of network traffic arriving at Router 7. For each vignette, the player watches
an animated scene, then must choose the correct DiffServ service class before a timer expires.
Correct choices advance the story with a success animation; wrong choices show a failure
animation and return the player to the decision point to retry.

**Why this priority**: This is the core gameplay loop. Without the classification decision
mechanic working across multiple traffic types, there is no game.

**Independent Test**: Can be fully tested by playing through all six vignettes (VoIP emergency
call, live video stream, bulk backup, routine email, background traffic flood, boss congestion
event) and verifying each accepts the correct classification and rejects incorrect ones.

**Acceptance Scenarios**:

1. **Given** the player is watching a vignette, **When** the decision moment appears, **Then**
   the player sees all valid DiffServ class options (EF, AF11-AF43, CS0-CS7, Default/BE) and
   a visible countdown timer.

2. **Given** a decision moment with a VoIP emergency call, **When** the player selects
   Expedited Forwarding (EF), **Then** a success animation plays and the story advances.

3. **Given** a decision moment with a VoIP emergency call, **When** the player selects any
   class other than EF, **Then** a failure animation plays (call drops) and the player
   retries from the checkpoint.

4. **Given** the player has completed all six vignettes correctly, **When** the boss-level
   congestion event begins, **Then** the player faces a rapid sequence of classification
   decisions that must all be correct to complete the level.

---

### User Story 2 - Learn From Contextual RFC Citations (Priority: P2)

A player encounters RFC terminology and DiffServ concepts during gameplay and can access
on-screen citations that link each concept to its authoritative RFC source. The player can
toggle citation visibility and review which RFC sections support what they just learned.

**Why this priority**: Educational accuracy is the project's non-negotiable pillar. Players
must be able to verify claims and study further using real RFC references.

**Independent Test**: Can be tested by toggling citation display during any vignette and
verifying each displayed term (EF, AF, DSCP, etc.) shows a "Source: RFC XXXX, Section X"
tag that matches the actual RFC content.

**Acceptance Scenarios**:

1. **Given** the player encounters a new DiffServ term for the first time (e.g., "EF"),
   **When** that term appears, **Then** a brief RFC-cited definition is displayed through
   a consistent UI mechanism before the term is used in context.

2. **Given** citation display is toggled on, **When** any technical claim appears on screen,
   **Then** an unobtrusive "Source: RFC XXXX, Section X" tag accompanies it.

3. **Given** a citation tag is displayed, **When** the player examines it, **Then** the
   cited RFC and section accurately support the claim being made.

---

### User Story 3 - Review Performance in Post-Level Debrief (Priority: P3)

After completing (or failing) the level, the player sees a debrief screen summarizing their
performance: which classifications they got right, which they got wrong, and links to RFC
sections for deeper study on topics they struggled with.

**Why this priority**: The debrief reinforces learning and provides a pathway to further
study, but the game is playable without it.

**Independent Test**: Can be tested by completing the level with a mix of correct and
incorrect answers, then verifying the debrief accurately reflects the player's choices
and provides relevant RFC references for missed questions.

**Acceptance Scenarios**:

1. **Given** the player completes the level, **When** the debrief screen appears, **Then**
   it shows a summary of each vignette with correct/incorrect status.

2. **Given** the player got a classification wrong, **When** viewing that vignette's debrief
   entry, **Then** the correct answer is shown along with an RFC citation explaining why.

3. **Given** the debrief is displayed, **When** the player reviews RFC links, **Then** each
   link corresponds to the actual RFC section relevant to that classification decision.

---

### User Story 4 - Experience Voiced Characters and Cinematic Animation (Priority: P4)

The player experiences the game with fully voiced characters (mentor, router, packet senders)
and pre-rendered hand-drawn animations for every scene and decision outcome, creating an
immersive Dragon's Lair-style cinematic experience.

**Why this priority**: Voice and animation are essential to the Dragon's Lair aesthetic but
the educational core functions with placeholder assets during development.

**Independent Test**: Can be tested by playing through all scenes and verifying each has
appropriate voice lines and animations for both success and failure outcomes.

**Acceptance Scenarios**:

1. **Given** any scene in the game, **When** a character speaks, **Then** the voice matches
   that character's defined profile (mentor is gruff, router is anxious, etc.).

2. **Given** the player makes a correct classification, **When** the success animation plays,
   **Then** it shows the packet successfully routing through in the established visual style.

3. **Given** the player makes an incorrect classification, **When** the failure animation
   plays, **Then** it shows a contextually appropriate consequence (dropped call, pixelated
   video, router fire, etc.) before returning to the checkpoint.

---

### User Story 5 - Build and Regenerate Game Assets (Priority: P5)

A developer can build the complete game including all AI-generated assets (images, video,
voice) using documented build commands, and can regenerate specific assets if needed while
maintaining consistency with the established visual and audio style guides.

**Why this priority**: This enables the development workflow but is not part of the player
experience.

**Independent Test**: Can be tested by running the documented build commands on a clean
checkout and verifying all assets are generated and the game runs.

**Acceptance Scenarios**:

1. **Given** a developer has cloned the repository, **When** they follow the README build
   instructions, **Then** all assets are generated and the game launches successfully.

2. **Given** assets have been generated, **When** the same generation is run again with
   identical prompts and seeds, **Then** the output matches the original (golden-file test).

3. **Given** the game is built, **When** a developer runs the test suite, **Then** all
   RFC citation tests, classification rule tests, and branch coverage tests pass.

---

### Edge Cases

- What happens when the player lets the decision timer expire without choosing?
  The game treats timeout as an incorrect answer, plays the failure animation, and
  returns to the checkpoint.

- What happens when the player rapidly presses multiple classification buttons?
  Only the first valid input within the decision window is accepted.

- What happens during the boss congestion event if the player gets one classification wrong?
  The failure animation plays and the entire congestion sequence restarts from the beginning
  of the boss encounter.

- What happens if an RFC citation in the manifest references an RFC section that doesn't exist?
  The automated test suite fails the build, blocking release until the citation is corrected.

## Requirements _(mandatory)_

### Functional Requirements

**Core Gameplay**

- **FR-001**: System MUST present six distinct traffic classification vignettes in sequence:
  VoIP emergency call, live video stream, bulk file backup, routine email, background traffic
  flood, and boss-level congestion event.

- **FR-002**: System MUST display DiffServ classification options using a progressive unlock
  with two-tier selection: top-level categories (EF, AF, CS, Default/BE) that expand to show
  specific classes (e.g., AF → AF11, AF21, AF31, AF41). Early vignettes present only the
  categories needed for that decision; additional categories unlock as the player encounters
  traffic types requiring them.

- **FR-003**: System MUST accept exactly one correct classification for each traffic type,
  determined by RFC 4594 guidelines.

- **FR-004**: System MUST play a success animation and advance the story when the player
  chooses correctly.

- **FR-005**: System MUST play a contextually appropriate failure animation and return to the
  checkpoint when the player chooses incorrectly or times out.

- **FR-006**: System MUST display a visible countdown timer during each decision moment with
  variable duration: 8 seconds for initial/tutorial vignettes, 5 seconds for standard vignettes,
  3 seconds for boss-level congestion event decisions.

- **FR-007**: System MUST require the player to correctly classify 5 packets in rapid
  succession during the boss-level congestion event to complete the level.

**Educational Content**

- **FR-008**: System MUST introduce each DiffServ term with an RFC-cited definition before
  using it in a classification decision.

- **FR-009**: System MUST provide toggleable RFC citation display showing "Source: RFC XXXX,
  Section X" for all technical claims.

- **FR-010**: System MUST maintain a citations manifest in the repository linking every
  in-game technical claim to its source RFC and section.

- **FR-011**: System MUST display a post-level debrief showing correct/incorrect status for
  each vignette with RFC references for further study.

**Audio/Visual**

- **FR-012**: System MUST provide pre-rendered animated cutscenes for every decision outcome
  (success and failure) in a consistent hand-drawn visual style.

- **FR-013**: System MUST provide voice acting for all character dialog using consistent
  voice profiles per character.

- **FR-014**: System MUST display subtitles by default for all voiced content.

- **FR-015**: System MUST present quick-time-event decision prompts with consistent visual
  styling, screen position, and lead time across all scenes.

- **FR-016**: System MUST render at 1920x1080 resolution (16:9 aspect ratio) with all video
  and image assets produced at this resolution.

- **FR-016a**: System MUST use MP4 container with H.264 codec for all video cutscene assets
  to ensure universal desktop playback compatibility and hardware acceleration.

**Input**

- **FR-017**: System MUST accept keyboard input for all player decisions.

- **FR-018**: System MUST accept gamepad input for all player decisions.

**Build/Development**

- **FR-019**: System MUST generate all AI assets (images, video, voice) at build time with
  no runtime generation.

- **FR-020**: System MUST provide documented build commands for generating all assets and
  running the game.

- **FR-021**: System MUST include automated tests verifying every classification rule matches
  RFC 4594.

- **FR-022**: System MUST include automated tests verifying every RFC citation exists in the
  referenced RFC.

- **FR-023**: System MUST include branch coverage tests confirming every decision path has
  both success and failure assets.

### Key Entities

- **Vignette**: A cinematic scene presenting one type of network traffic. Contains: traffic
  type, correct DiffServ classification, success animation, failure animation, character
  dialog, RFC citations.

- **Traffic Type**: A category of network packet with specific QoS requirements. Contains:
  name, description, correct service class, RFC source reference.

- **Service Class**: A DiffServ classification option. Contains: name (EF, AF11, CS0, etc.),
  DSCP value, PHB behavior description, RFC source reference.

- **Citation**: A reference linking in-game content to RFC authority. Contains: claim text,
  RFC number, section number, verification status.

- **Character**: A voiced entity in the game. Contains: name, role, voice profile settings,
  dialog lines.

- **Player Progress**: The player's state within the level. Contains: current vignette,
  decision history (correct/incorrect per vignette), retry count.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Players can complete the full level in under 15 minutes on their first
  successful playthrough.

- **SC-002**: 100% of classification decisions have exactly one correct answer traceable
  to RFC 4594.

- **SC-003**: 100% of RFC citations displayed in-game are verified to exist in the
  referenced RFC document.

- **SC-004**: The opening cutscene displays its first frame within 3 seconds of game launch.

- **SC-005**: Player input during decision moments registers within 50 milliseconds.

- **SC-006**: The complete game including all assets fits within 1 GB of storage.

- **SC-007**: 100% of decision paths (success and failure for each vignette) have
  corresponding animated assets.

- **SC-008**: Players who complete the level can correctly identify the appropriate service
  class for common traffic types (VoIP, video, bulk transfer, email) when asked.

- **SC-009**: All build commands complete successfully on a documented reference environment.

- **SC-010**: The automated test suite achieves 100% pass rate before release.

## Assumptions

- Players are using desktop computers with keyboard or gamepad input; touch and mobile
  devices are out of scope.

- Players have a basic understanding that network traffic exists but no prior knowledge
  of DiffServ, DSCP, or QoS concepts.

- English is the only supported language for this iteration.

- The game consists of a single level ("Rush Hour at Router 7"); additional levels are
  out of scope.

- All AI-generated assets (via OpenAI, Nano Banana, Veo3) will be created at build time
  and committed or cached; runtime API calls are forbidden per the constitution.

- The RFC MCP server will be available during development to verify all technical claims.

- Pre-rendered video assets will be bundled with the game rather than streamed.

- No save system is needed; the single level is designed to be completed in one session.

- No online features, accounts, or multiplayer functionality are included.
