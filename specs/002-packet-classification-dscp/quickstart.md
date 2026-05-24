# Quickstart: Is This Packet Important?

## Prerequisites

- **Node.js** 20+ (for build scripts and dev server)
- **npm** or **pnpm** (package manager)
- **API Keys** (for asset generation):
  - `OPENAI_API_KEY` - OpenAI API key (for image generation and TTS)
  - `GOOGLE_AI_API_KEY` - Google AI API key (for Nano Banana/Gemini images)
  - `VEO_API_KEY` - Veo3 API key (for video generation)

## Quick Start (Play Only)

If you just want to play the game with existing assets:

```bash
# Clone the repository
git clone https://github.com/your-org/is-this-packet-important.git
cd is-this-packet-important

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

## Full Build (Generate All Assets)

To regenerate all AI-generated assets from scratch:

```bash
# 1. Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# 2. Install dependencies
npm install

# 3. Fetch RFC citations (requires RFC MCP server)
npm run fetch-citations

# 4. Generate still images
npm run gen-images

# 5. Generate voice-over audio
npm run gen-tts

# 6. Generate cutscene videos
npm run gen-cutscenes

# 7. Build for production
npm run build

# 8. Preview production build
npm run preview
```

## Development Workflow

### Running the Dev Server

```bash
npm run dev
```

Opens at `http://localhost:5173` with hot module replacement.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test suites
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:citations   # RFC citation verification
```

### Verifying RFC Citations

```bash
# Verify all citations against live RFCs
npm run verify-citations

# This will:
# 1. Read content/citations.json
# 2. Fetch each cited RFC section via RFC MCP server
# 3. Compare against recorded excerpts
# 4. Report any drift or missing citations
```

### Regenerating Specific Assets

```bash
# Regenerate a single image
npm run gen-images -- --id character-mentor

# Regenerate a specific cutscene
npm run gen-cutscenes -- --id vignette-01-success

# Regenerate voice lines for a character
npm run gen-tts -- --character mentor

# Force regeneration (ignore cache)
npm run gen-images -- --force
```

## Project Structure

```
is-this-packet-important/
├── src/                    # Game runtime code
│   ├── index.html          # Entry point
│   ├── main.js             # App bootstrap
│   ├── lib/                # Core modules
│   └── components/         # UI components
├── content/                # Game content (JSON)
│   ├── level-01.json       # Level definition
│   ├── dscp-classes.json   # DSCP mappings
│   └── citations.json      # RFC citations
├── assets/                 # Generated images
├── cutscenes/              # Generated videos
├── audio/                  # Generated voice-over
├── scripts/                # Build-time scripts
├── tests/                  # Test suites
└── dist/                   # Production build (gitignored)
```

## Configuration Files

| File                        | Purpose                                    |
| --------------------------- | ------------------------------------------ |
| `assets/style-guide.md`     | Visual style template for image generation |
| `audio/voice-config.json`   | Character voice profiles for TTS           |
| `content/dscp-classes.json` | Single source of truth for DSCP values     |
| `vite.config.js`            | Vite build configuration                   |
| `vitest.config.js`          | Vitest test configuration                  |

## npm Scripts Reference

| Script                     | Description                        |
| -------------------------- | ---------------------------------- |
| `npm run dev`              | Start development server           |
| `npm run build`            | Build for production               |
| `npm run preview`          | Preview production build           |
| `npm test`                 | Run all tests                      |
| `npm run test:watch`       | Run tests in watch mode            |
| `npm run fetch-citations`  | Fetch RFC citations via MCP server |
| `npm run verify-citations` | Verify citations against live RFCs |
| `npm run gen-images`       | Generate still images              |
| `npm run gen-cutscenes`    | Generate video cutscenes           |
| `npm run gen-tts`          | Generate voice-over audio          |
| `npm run lint`             | Run ESLint                         |
| `npm run format`           | Run Prettier                       |

## Troubleshooting

### "RFC MCP server not available"

The RFC citation scripts require the RFC MCP server to be running. Ensure it's configured
in your environment. See `.env.example` for configuration.

### "Asset generation failed"

1. Check your API keys in `.env`
2. Check API rate limits (especially for video generation)
3. Try regenerating with `--force` flag

### "Golden file test failed"

This means an asset changed unexpectedly. Either:

1. Update the golden checksum if the change is intentional
2. Investigate why the prompt/seed produced different output

### "Citation verification failed"

An RFC may have been updated. Review the diff and update `citations.json` if the change
doesn't affect educational accuracy. All citation changes require human review.

## Playing the Game

1. Launch the game via `npm run dev` or open the built `dist/index.html`
2. Watch the intro cutscene
3. When a decision moment appears:
   - Select the correct DiffServ service class
   - Use keyboard (1-4) or gamepad to choose
4. Complete all 6 vignettes and the boss event
5. Review your performance in the debrief screen

### Controls

| Input     | Action                            |
| --------- | --------------------------------- |
| `1-4`     | Select category (EF, AF, CS, BE)  |
| `Q/W/E/R` | Select sub-class (when expanded)  |
| `C`       | Toggle RFC citations              |
| `Space`   | Skip cutscene (after first watch) |
| `Escape`  | Pause menu                        |

Gamepad: Use D-pad/left stick for selection, A/X to confirm.
