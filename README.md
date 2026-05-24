# Is This Packet Important?

A Dragon's Lair-style educational game teaching DiffServ packet classification based on RFC 4594.

## Overview

**Rush Hour at Router 7** puts players in the role of a network traffic controller at a busy router junction. Watch cutscene vignettes introducing different types of network traffic, then classify packets correctly under time pressure. Make the right DSCP/PHB classification to keep the network running smoothly!

## Features

- **6 Unique Vignettes**: Emergency VoIP, video conferences, bulk backups, and more
- **Progressive Learning**: Categories unlock as you master the basics
- **Boss Event**: 5 rapid-fire packets with only 3 seconds each
- **RFC Citations**: Every technical claim links back to authoritative RFCs
- **Educational Debrief**: Review your decisions with correct answers and study links

## Quick Start

### Prerequisites

- Node.js 20.0.0 or higher
- npm 9.0.0 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/IsThisPacketImportant.git
cd IsThisPacketImportant

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Open browser to http://localhost:5173/src/index.html
```

### Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Watch mode for development
npm run test:watch
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Asset Generation

The game uses AI-generated assets (images, voice, cutscenes). Generation scripts require API keys.

### Environment Setup

Create a `.env` file (see `.env.example`):

```bash
OPENAI_API_KEY=your-openai-key      # For TTS and images
GOOGLE_AI_API_KEY=your-google-key   # For Gemini images (optional)
VEO_API_KEY=your-veo-key            # For cutscene videos
```

### Generation Scripts

```bash
# Generate placeholder videos (no API key needed)
npm run gen-placeholders

# Generate voice audio (requires OPENAI_API_KEY)
npm run gen-tts

# Generate images (requires OPENAI_API_KEY)
npm run gen-images

# Generate cutscenes (requires VEO_API_KEY)
npm run gen-cutscenes
```

### Idempotent Regeneration

All generation scripts support idempotent regeneration:

- Checksums track prompts/text content
- Existing assets are skipped if checksum matches
- Use `--force` to regenerate all assets

```bash
npm run gen-tts -- --force    # Force regenerate all voice lines
npm run gen-images -- --force # Force regenerate all images
```

## RFC Citation Workflow

### Fetching Citations

```bash
# Fetch/update citations from RFC Editor
npm run fetch-citations
```

### Verifying Citations

```bash
# Verify all citations are still valid
npm run verify-citations

# CI mode (strict, minimal output)
npm run verify-citations:ci

# Dry run (show what would be verified)
npm run verify-citations -- --dry-run
```

## Project Structure

```
IsThisPacketImportant/
├── src/
│   ├── index.html         # Entry point
│   ├── main.js            # Bootstrap and game loop
│   ├── styles/            # CSS styles
│   ├── lib/               # Core modules
│   │   ├── classifier.js  # DSCP classification logic
│   │   ├── scene-graph.js # State machine
│   │   ├── timer.js       # Countdown timer
│   │   └── ...
│   ├── components/        # UI components
│   │   ├── decision-ui.js # Classification UI
│   │   ├── citation.js    # RFC citation display
│   │   ├── debrief.js     # Post-level summary
│   │   └── ...
│   └── data/              # Data loaders
├── content/
│   ├── dscp-classes.json  # DSCP/PHB definitions (RFC 4594)
│   ├── level-01.json      # Level scene graph
│   ├── citations.json     # RFC citation manifest
│   └── dialog/            # Dialog scripts
├── audio/
│   ├── voice/             # Generated TTS files
│   └── manifest.json      # Audio asset tracking
├── assets/
│   ├── images/            # Generated images
│   └── manifest.json      # Image asset tracking
├── cutscenes/
│   ├── level-01/          # Video files
│   └── manifest.json      # Cutscene tracking
├── scripts/               # Build/generation scripts
└── tests/
    ├── unit/              # Unit tests
    └── integration/       # Integration tests
```

## Technical Details

### DSCP Classification

The game teaches the DiffServ Code Point system defined in RFC 4594:

| Category                  | DSCP Values            | Use Cases            |
| ------------------------- | ---------------------- | -------------------- |
| EF (Expedited Forwarding) | 46                     | VoIP, real-time      |
| AF (Assured Forwarding)   | 10-43                  | Video, streaming     |
| CS (Class Selector)       | 0-56 (increments of 8) | Legacy compatibility |
| BE (Best Effort)          | 0                      | Default traffic      |

### Timer Modes

- **Tutorial**: 8 seconds (first vignette)
- **Standard**: 5 seconds (vignettes 2-5)
- **Boss**: 3 seconds (boss event)

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## NPM Scripts Reference

| Script                     | Description                 |
| -------------------------- | --------------------------- |
| `npm run dev`              | Start Vite dev server       |
| `npm run build`            | Production build to `dist/` |
| `npm run preview`          | Preview production build    |
| `npm test`                 | Run all tests               |
| `npm run test:unit`        | Unit tests only             |
| `npm run test:integration` | Integration tests only      |
| `npm run test:watch`       | Test watch mode             |
| `npm run lint`             | Run ESLint                  |
| `npm run format`           | Format with Prettier        |
| `npm run gen-tts`          | Generate voice audio        |
| `npm run gen-images`       | Generate images             |
| `npm run gen-cutscenes`    | Generate cutscenes          |
| `npm run gen-placeholders` | Generate placeholder videos |
| `npm run fetch-citations`  | Fetch RFC citations         |
| `npm run verify-citations` | Verify citations            |

## RFC References

- [RFC 4594](https://www.rfc-editor.org/rfc/rfc4594) - Configuration Guidelines for DiffServ Service Classes
- [RFC 2474](https://www.rfc-editor.org/rfc/rfc2474) - Definition of the Differentiated Services Field
- [RFC 2475](https://www.rfc-editor.org/rfc/rfc2475) - Architecture for Differentiated Services
- [RFC 2597](https://www.rfc-editor.org/rfc/rfc2597) - Assured Forwarding PHB Group
- [RFC 3246](https://www.rfc-editor.org/rfc/rfc3246) - Expedited Forwarding PHB

## License

MIT
