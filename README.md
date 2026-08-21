# DYEING AI WEB V2.2

V2.2 adds an AI-style Search layer on top of V2.1.

## What changed

- Intent Detection:
  - History
  - Find effective method
  - Find failed method
  - Next-action recommendation
  - Analysis / root-cause question
- Scope Detection:
  - Product
  - Problem
  - Batch
  - Product + Problem
- Ambiguous scope does NOT default to another product.
- Multiple matching Cases are shown instead of auto-selecting one.
- Case Actions are summarized from `case_actions`.
- Confirmed methods are shown only when `effective = true`.

## Important

This V2.2 is an **AI-search prototype**, not an LLM API yet.
The intent/scope layer is deterministic and evidence-based.
The next step is optional integration with an LLM API after the search/retrieval layer is stable.

## Branch

Develop/test on:
`v2-case-actions`

Keep `main` as the stable branch until approved.

## Local test

Open `index.html` in a browser, or serve the folder with any static server.

## Git

```powershell
git add index.html app.js style.css README.md
git commit -m "Add V2.2 AI search and intent detection"
git push -u origin v2-case-actions
```
