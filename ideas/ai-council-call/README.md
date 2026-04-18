# AI Council Call (prototype)

Zoom-style multi-agent meeting UI with two modes:

- **Structured turns**: one personality responds at a time.
- **Contentious interruptions**: personalities can interject and rebut each other.

## What's simplified now

- Anthropic-only API path (single Anthropic key input).
- A dedicated **Orchestrator** call generates a moderator brief before persona responses.
- Each persona call uses its own perspective prompt (`systemPrompt`) so responses are not routed through one generic prompt.

## Features

- Multi-persona transcript with separate prompts per personality.
- Configurable interruption intensity in contentious mode.
- Dynamic persona creation (name + perspective prompt + voice profile).
- Optional spoken responses using browser Web Speech API.
- Local simulation fallback when Anthropic key is missing.

## One-click web launch

If this repo is on GitHub, use the workflow **Deploy AI Council Call to GitHub Pages** to publish a shareable URL without using a local terminal.

## Run locally

```bash
python -m http.server 8000
```

Open <http://localhost:8000>.
