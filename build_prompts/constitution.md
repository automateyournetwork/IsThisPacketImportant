Create the governing principles for "Is This Packet Important?" — an educational Dragon's Lair-style cinematic adventure game that teaches DiffServ Quality of Service concepts grounded in RFC 4594 and the broader DiffServ RFC family (2474, 2475, 2597, 3246). Establish enforceable principles in five pillars:

CODE QUALITY

- Strict separation between content (RFC-derived facts, dialog, classification logic) and presentation (rendering, animation, audio playback). Content must be addressable as data, never hardcoded into render loops.
- Single source of truth for every DSCP value, PHB class, and traffic-class definition: one lookup module, referenced everywhere.
- No magic numbers for DSCP code points, drop precedences, or queue priorities — all must resolve through named constants traceable to a specific RFC section.
- Pure functions for all packet-classification decision logic so it can be tested without the game loop running.
- Linting and formatting enforced on every commit; no merging with warnings.

TESTING STANDARDS

- Every classification rule, every PHB mapping, and every branching cutscene decision must have a unit test asserting it matches the cited RFC.
- Each RFC-derived fact in dialog or on-screen text must carry an inline citation (RFC number + section) in the source, verified by an automated test that the citation exists in the referenced RFC.
- Quick-time-event input handling must have deterministic tests: given input X at time T, branch Y is taken.
- Golden-file tests for generated assets: regenerating an image, voice line, or cutscene with the same prompt and seed must not silently change what ships.
- A "no broken cutscene path" test that walks every branch in the level graph and confirms each terminal node has both a correct-path and failure-path asset.

UX CONSISTENCY

- One visual style guide for all generated art assets (palette, line weight, character proportions, lighting direction) documented as a prompt template; every image-generation call composes from that template.
- One voice profile per character via OpenAI TTS — voice ID, speed, and style locked in a config file, never overridden ad-hoc.
- Quick-time-event affordances are consistent: the same input prompt graphic, same on-screen position, same lead time before the decision window closes, every scene.
- All RFC terminology is introduced before use. First appearance of "EF," "AF41," "DSCP," etc. is accompanied by a short, RFC-cited definition surfaced through the same UI mechanism every time.
- Subtitles always on by default; audio is never the sole channel for educational content.

PERFORMANCE

- Time-to-first-frame of the opening cutscene under 3 seconds on a mid-range laptop.
- Cutscene video playback must not stutter; assets pre-rendered and bundled, not generated at runtime.
- Decision input latency under 50ms from key press to branch transition starting.
- Memory footprint of the single level under 1 GB including all video, audio, and image assets.
- All AI-generated assets (images, video, TTS audio) are produced at build time and cached on disk — runtime never calls Veo3, Nano Banana, OpenAI image, or OpenAI TTS APIs.

EDUCATIONAL ACCURACY (non-negotiable pillar)

- Every technical claim in the game must be sourced from an RFC retrieved via the RFC MCP server during development, with the RFC + section recorded in a citations manifest committed to the repo.
- If the RFC MCP server cannot confirm a claim, the claim is cut — no inferring, no "close enough," no filler from model priors.
- A reviewer pass before shipping each scene: read the scene's script against its cited RFC sections; mismatch blocks the scene.
