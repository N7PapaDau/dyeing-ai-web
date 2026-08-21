
# DYEING AI WEB — V2.2 STATE UPDATE

Current development stage: V2.2 — AI Search + Intent Detection.

## V2.2 behavior

The search layer must determine:
1. Intent — what the user wants.
2. Scope — which Product/Problem/Batch the user is asking about.

Supported intent examples:
- History / xử lý trước đây
- Find effective method / phương pháp đã hiệu quả
- Find failed method / phương pháp đã NG
- Next action / mẻ tiếp theo
- Analysis / nguyên nhân

Supported scope:
- Product
- Problem
- Batch
- Product + Problem

Rules:
- Unknown scope → ask user to clarify.
- Multiple matching Cases → show all matching Cases; do not auto-select one.
- Batch-specific query → only that Batch.
- Product + Problem query → filter by both.
- Do not mix Case histories.
- AI summary must distinguish recorded facts from AI suggestions.
- Do not claim root cause unless the database contains confirmed evidence.

Current database:
- `dyeing_cases`
- `case_actions`

Next phase after V2.2:
- optional LLM integration after retrieval/search is stable.
