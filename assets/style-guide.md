# Visual Style Guide: Is This Packet Important?

## Art Direction Summary

**Theme**: Retro-futuristic data visualization meets 80s arcade aesthetics
**Mood**: Urgent but playful, technical but accessible
**Palette**: Dark backgrounds with neon accent colors (cyan, magenta, electric blue)

## Color Palette

### Primary Colors

| Name          | Hex       | Usage                      |
| ------------- | --------- | -------------------------- |
| Deep Space    | `#0a0a1a` | Background, dark areas     |
| Neon Cyan     | `#00d4aa` | Primary UI, success states |
| Electric Blue | `#0088ff` | Secondary UI, links        |
| Hot Pink      | `#ff4444` | Danger, failure states     |
| Warning Amber | `#ffaa00` | Timer warnings, alerts     |
| Success Green | `#44ff44` | Correct answers            |

### Secondary Colors

| Name         | Hex                      | Usage                 |
| ------------ | ------------------------ | --------------------- |
| Grid Blue    | `#1a1a3a`                | Panel backgrounds     |
| Text White   | `#ffffff`                | Primary text          |
| Dim Gray     | `#aaaaaa`                | Secondary text, hints |
| Overlay Dark | `rgba(10, 10, 26, 0.85)` | Modal overlays        |

## Visual Elements

### Data Packets

**Concept**: Packets appear as glowing geometric shapes traveling along data "highways"

**Prompt Template for Packet Visualization**:

```
"A glowing [COLOR] hexagonal data packet with digital circuit patterns,
floating in a dark cyberspace environment, neon edges, sci-fi aesthetic,
vector style, 1920x1080, clean lines, no text"
```

**Packet Colors by Class**:

- EF (Emergency): Bright red/orange glow, pulsing
- AF4x (Real-time): Cyan/teal glow
- AF1x (Bulk): Green glow
- CS1 (Low Priority): Dim gray/blue glow
- BE (Default): White/neutral glow

### Router 7

**Concept**: A massive, anthropomorphized router at a critical network junction

**Visual Design**:

- Central processing "eye" that reacts to decisions
- Multiple ports visualized as highways entering/exiting
- Stress indicators (heat waves, sparks) during boss events
- Art deco meets server room aesthetic

**Prompt Template for Router**:

```
"A massive futuristic network router personified with a glowing central eye,
multiple data ports shown as neon light highways, dark data center environment,
cyberpunk aesthetic, dramatic lighting, 1920x1080, cinematic composition"
```

### Mentor Character (Dr. Qos)

**Concept**: A wise holographic guide with network-themed visual elements

**Visual Design**:

- Semi-transparent holographic appearance
- Circuit patterns on clothing/form
- Glasses that display real-time network stats
- Warm, approachable expression

**Prompt Template for Mentor**:

```
"A wise holographic mentor character with circuit pattern details,
translucent cyan glow, wearing smart glasses with data displays,
friendly expression, dark background, sci-fi mentor aesthetic, portrait style"
```

### Traffic Senders

Each traffic type has a visual representation:

**Emergency VoIP**:

```
"Emergency services dispatcher headset icon, red urgent glow,
heartbeat/waveform pattern, dark background, minimalist icon style"
```

**Video Conference**:

```
"Corporate video stream icon with pixelated face outline,
professional blue glow, grid pattern, dark background, tech icon style"
```

**Backup Transfer**:

```
"Database synchronization icon with stacked cylinders,
green data flow arrows, server rack aesthetic, dark background"
```

**Email**:

```
"Standard envelope icon with @ symbol, neutral white glow,
simple clean design, dark background, minimal tech icon"
```

**P2P/Torrent**:

```
"Peer-to-peer swarm icon showing multiple nodes connected,
chaotic orange connections, bandwidth meter overflowing, dark background"
```

## UI Elements

### Decision Buttons

**Style**: Rounded rectangles with glowing borders

**States**:

- Default: Dark fill, colored border
- Hover: Color fill, dark text
- Selected: Pulsing glow effect
- Disabled: Dimmed, no glow

**Prompt Template**:

```
"Game UI button with rounded corners, neon [COLOR] border glow,
dark semi-transparent fill, futuristic font placeholder,
hover state with full color fill, 300x80 pixels"
```

### Timer Bar

**Style**: Horizontal progress bar with gradient fill

**States**:

- Normal (>3s): Cyan to blue gradient
- Warning (<3s): Yellow to red gradient
- Critical (<1s): Pulsing red

### Citation Overlay

**Style**: Floating panel with monospace font

**Design**:

- Semi-transparent dark background
- Cyan border accent
- RFC number highlighted
- Subtle fade-in animation

## Animation Guidelines

### Transitions

- Scene transitions: 300ms fade with subtle scale
- UI element appearances: 150ms fade-in
- Timer animations: Linear countdown
- Success/Failure flashes: Quick pulse (100ms)

### Idle Animations

- Packets: Gentle floating/bobbing motion
- Router eye: Slow scanning movement
- Background: Subtle data stream particles

## Cutscene Prompts (Veo3)

### Intro Sequence

```
"Camera pushes through a dark data center, glowing server racks on both sides,
arrives at a massive glowing router junction, dramatic reveal of Router 7,
cyberpunk aesthetic, neon lighting, cinematic 24fps, 1920x1080"
```

### Decision Moment

```
"Close-up of glowing data packet arriving at router junction,
multiple pathway options light up, timer counting down visible,
tense atmosphere, neon highlights, 1920x1080"
```

### Success Outcome

```
"Data packet travels down correct glowing pathway,
satisfying whoosh effect, green confirmation flash,
triumphant mood, smooth camera follow, 1920x1080"
```

### Failure Outcome

```
"Data packet gets stuck or goes wrong direction,
red warning lights flash, router shows distress,
urgent mood, quick cuts, 1920x1080"
```

### Boss Event

```
"Multiple packets flooding in simultaneously,
chaotic but organized visual, clock ticking urgently,
intense lighting changes, rapid-fire decisions needed, 1920x1080"
```

## Asset Specifications

| Asset Type          | Resolution | Format    | Notes                  |
| ------------------- | ---------- | --------- | ---------------------- |
| Cutscene Video      | 1920x1080  | MP4/H.264 | 24fps, ~30s each       |
| Character Portraits | 512x512    | PNG       | Transparent background |
| UI Icons            | 128x128    | PNG       | Transparent background |
| Backgrounds         | 1920x1080  | JPG       | 85% quality            |
| Packet Sprites      | 256x256    | PNG       | Transparent, animated  |

## Generation Parameters

### Nano Banana / Gemini

- Model: imagen-3.0-generate-001
- Aspect ratio: 16:9 for scenes, 1:1 for icons
- Style: "digital art, neon, cyberpunk"

### OpenAI DALL-E

- Model: dall-e-3
- Quality: hd
- Style: vivid
- Size: 1792x1024 for scenes, 1024x1024 for portraits

### Veo3

- Resolution: 1920x1080
- Frame rate: 24fps
- Duration: 5-30 seconds per clip
- Style prompt prefix: "cinematic, smooth motion, consistent lighting"

## Seed Management

All generated assets should record:

1. Full prompt used
2. Model version
3. Seed value (if available)
4. Timestamp
5. Checksum of output

This enables deterministic regeneration per constitution requirements.
