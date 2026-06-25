# Spec Documents

The DGFS-1.0 specification. **Place all five source documents in this folder** before starting the build. They are the authoritative design; the code extracts from them.

## Conflict Hierarchy

```
ADDENDUM  >  CLAUDE.md  >  JSON SPEC  >  DESIGN DOC
```

Higher wins. The Audit is reference-only.

## The Five Documents

| File | Role |
|------|------|
| `DGFS-1.0-Spec-Addendum.md` | **Authoritative.** Final numeric values, mechanic definitions, system specs, conflict resolutions, scope expansion. Read this for any concrete value. |
| `DGFS-1.0-Revised-Master-Build-Prompt.md` | The build prompt: constraints, build order, tone bar, telemetry, success metrics, red flags. |
| `DGFS-1.0-spec.json` | Machine-readable architecture: compounding mechanisms, feedback loops, design philosophy. Authoritative where the Addendum is silent. |
| `DGFS-1.0-Design-Document.docx` | Human-readable reasoning. Section 13 = AI coding context. Section 2 = pillars/tone. |
| `DGFS-1.0-Spec-Audit.md` | Reference only. Explains what gaps were found and why the Addendum exists. No action required. |

> Note: the repo's own `docs/PRE-BUILD-DECISIONS.md` resolves four items that post-date the Addendum (engine lock, scope confirmation, yips floor, decision-metric status). Where it speaks, it is current.

## If a value is missing here

Stop. Flag `[SPEC GAP: ...]`. Do not invent. The spec was audited — a genuinely new gap is worth surfacing, not papering over.
