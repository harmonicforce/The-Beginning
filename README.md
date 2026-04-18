# new-ideas

This repository is now entirely a **new-ideas incubator**.

## Repo contract

- Every experiment lives in `ideas/<idea-slug>/`
- Every idea gets its own branch: `idea/<idea-slug>`
- Do not mix multiple ideas in a single branch
- Promote mature ideas into dedicated repositories

## Structure

- `ideas/` — active experiments
- `archive/` — retired or extracted experiments
- `templates/` — starter templates/checklists

## Branch workflow

```bash
# create a new idea workspace
git checkout -b idea/<idea-slug>
mkdir -p ideas/<idea-slug>

# when done, open PR from idea/<idea-slug>
```

## Current idea

- `ideas/ai-council-call/` — Zoom-style multi-agent meeting prototype with turn-based/contentious modes and optional voice output.

## One-click launch (GitHub Pages)

A workflow is included at `.github/workflows/deploy-ai-council-pages.yml` that deploys `ideas/ai-council-call` directly to GitHub Pages.

### First-time setup

1. Push this repository to GitHub.
2. In **Settings → Pages**, set **Build and deployment** to **GitHub Actions**.
3. Open **Actions → Deploy AI Council Call to GitHub Pages** and click **Run workflow**.

### Launch URL

After deployment, open:

`https://<your-github-username>.github.io/<repo-name>/`

This works well for headset/mobile testing because it removes local terminal requirements.

## Local run (optional)

```bash
cd ideas/ai-council-call
python -m http.server 8000
```

Open <http://localhost:8000>.
