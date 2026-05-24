/speckit.specify Build "Is This Packet Important?" — a single-level educational adventure game in the cinematic style of Dragon's Lair (1983): the player watches lushly animated scenes and must make split-second correct decisions at branching moments, with wrong decisions triggering a "death" cutscene and a retry, and correct decisions advancing the story.

THE PREMISE
The player is a newly-hired packet-handling apprentice at a struggling internet router on the edge of collapse. Traffic is surging, the queues are overflowing, and the router's old packet handler has vanished. The player must learn to classify incoming traffic by importance — using DiffServ Quality of Service principles — and route each packet to the correct queue before the network melts down.

THE LEVEL (scope for now)
One self-contained level: "Rush Hour at Router 7." The player faces a sequence of cinematic vignettes, each presenting a different type of network traffic arriving at the router:

- A VoIP call from a hospital coordinating an emergency
- A live video stream
- A bulk file backup
- A routine email
- A flood of low-priority background traffic threatening to overwhelm the queue
- A boss-level finale: a congestion event where the player must make a rapid sequence of correct classifications to save the router

For each vignette, the scene plays out cinematically, then a decision moment appears: the player chooses which DiffServ service class the packet belongs to (Expedited Forwarding, Assured Forwarding with its four classes and three drop precedences, Class Selector, or Default/Best Effort). Correct choice → an animated success beat showing the packet sailing through. Wrong choice → an animated failure beat (the hospital call drops mid-sentence, the video pixelates, the router catches fire) followed by a retry from the last checkpoint.

THE EDUCATIONAL CORE
The game teaches, through play, what each DiffServ service class is for, why it exists, and what happens when traffic is misclassified. The player should finish the level able to explain in plain language why VoIP needs EF treatment, what AF's drop precedences mean, and why best-effort isn't a bad thing — just a different thing. All technical content traces back to a specific RFC, retrieved through the RFC MCP server during development, and cited on-screen in an unobtrusive "Source: RFC \_**\_, §**" tag the player can toggle.

THE EXPERIENCE

- Fully voiced characters: the player's mentor (a gruff veteran packet handler), the router itself (anxious, overworked), and the various senders whose packets they're sorting.
- Pre-rendered animated cutscenes for every decision outcome, in a consistent hand-drawn aesthetic.
- Quick-time-event style decision moments with a clear visual prompt, a visible countdown, and a fair input window.
- A short post-level debrief screen summarizing what the player got right, what they got wrong, and which RFC sections to read to go deeper.

WHY
Network engineers learn DiffServ from dense RFCs. Most never get an intuitive feel for why the classes exist. A short, replayable, beautifully-animated game can build that intuition in fifteen minutes — and the player walks away with the actual RFC citations to study further. The Dragon's Lair format is deliberately chosen: it's cinematic enough to make the abstract concept of "packet importance" feel visceral, and its branching-failure structure rewards understanding over reflex.

OUT OF SCOPE FOR THIS ITERATION

- Additional levels beyond Rush Hour at Router 7
- Multiplayer
- Player-authored content
- Mobile/touch input (desktop keyboard or gamepad only for now)
- Localization beyond English

## CREATOR REQUIREMENTS

- Use OpenAI, Nano Banana, and Veo3 APIs to generate all art, animation, voice, and video assets at build time, with no runtime generation.
- Implement a robust testing suite that verifies every classification rule, every RFC citation, and every branching decision against the source RFCs.
- As part of this process run the asset builder to generate all necessary assets for the level, ensuring they meet the visual and performance standards outlined in the constitution.
- Provide a clear README with instructions for how to build, run, and test the game locally, including how to regenerate assets if needed.
