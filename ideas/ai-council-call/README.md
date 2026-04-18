# AI Council Call (prototype)

Zoom-style multi-agent meeting UI with two modes:

- **Structured turns**: one personality responds at a time.
- **Contentious interruptions**: personalities can interject and rebut each other.

## Features

- Multi-provider adapters for OpenAI, Anthropic, Gemini, and local fallback simulation.
- Live participant grid and transcript feed.
- Configurable interruption intensity in contentious mode.
- Dynamic persona creation (name, style prompt, provider, and voice profile).
- Optional spoken responses using the browser Web Speech API.

## One-click web launch

If this repo is on GitHub, use the workflow **Deploy AI Council Call to GitHub Pages** to publish a shareable URL without using a local terminal.

## Run locally

```bash
python -m http.server 8000
```

Open <http://localhost:8000>.

## How to test interruption + voice mode

1. Select **Contentious (Interruptions)** in Meeting Mode.
2. Keep **Enable spoken responses** checked in Voice Output.
3. Raise **Interruption Intensity**.
4. Click **Start Meeting**, then **Next Action** repeatedly.
5. Look for red-highlighted transcript entries (interruptions) and listen for overlapping speech.
