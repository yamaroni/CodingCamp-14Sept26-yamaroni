# Implementation Plan: Expense & Budget Visualizer

## Overview

This plan builds the Expense & Budget Visualizer incrementally in vanilla HTML, CSS, and JavaScript with Chart.js loaded via CDN. Work starts from scaffolding (markup, stylesheet, script skeleton, and the DOM contract), then fills in the logical modules inside the single `js/app.js` in dependency order: State → Storage → Validation → Calculation → Render → Controller. Each step builds on the previous one and ends by wiring the new module into the running app so there is no orphaned code. The final steps wire all events together through `init()` and polish the presentation.

Per project constraints, there is no test framework or build tooling to set up. Testing is a lightweight manual verification checklist (see design Testing Strategy). Any automated property tests are optional (marked with `*`) and must never require setting up heavy test infrastructure — they map one-to-one to the pure functions in the Validation, Calculation, and Storage modules and can be run ad hoc if the team chooses.

## Tasks

- [x] 1. Scaffold the project structure, DOM contract, and script skeleton
  - Create `index.html` with the Chart.js CDN `<script>` tag, exactly one stylesheet include (`css/styles.css`), and exactly one application script include (`js/app.js`).
  - Add the DOM contract elements: `#balance-display` (above list and chart), `#transaction-form` with `#item-name`, `#amount`, a `#category` `<select>` (Food/Transport/Fun) plus per-field message elements and a submit button, `#transaction-list` container, `#chart-container` with `<canvas id="spending-chart">` and `#chart-empty`, and a shared `#app-message` region.
  - Create `css/styles.css` with base layout placing balance above list and chart, and body text at a minimum of 14px.
  - Create `js/app.js` with commented module section headers (State, Validation, Storage, Calculation, Render, Controller) and a no-op `init()` invoked on DOM ready, so the page loads and runs without error.
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 2. Implement the State module and Transaction data model
  - [x] 2.1 Define the Transaction typedef and State module functions
    - Document the `Transaction` shape (`id`, `name`, `amount`, `category`).
    - Implement the in-memory `transactions` array as the single source of truth with `getTransactions()`, `setTransactions(list)`, `addTransaction(tx)`, and `removeTransaction(id)`.
    - Implement an id generator using `crypto.randomUUID()` with a timestamp+random fallback.
    - Ensure the State module never touches the DOM or Local Storage directly.
    - _Requirements: 1.2, 2.4_

- [x] 3. Implement the Storage module with load/save and error handling
  - [x] 3.1 Implement `loadTransactions()` with defensive parsing and validation
    - Read the raw string under key `ebv.transactions`; return an empty list with no error when absent.
    - Parse JSON and validate the versioned schema (`version`, `transactions` array) and each entry (`id` string, `name` 1–100 chars, finite `amount` in range, `category` in {Food, Transport, Fun}).
    - On parse or schema failure, return an empty list plus a `corrupt` error and do NOT overwrite the stored value.
    - _Requirements: 5.3, 5.4, 5.5_

  - [x] 3.2 Implement `saveTransactions(list)` with write/quota failure handling
    - Serialize to the versioned JSON document and write to Local Storage.
    - Catch `QuotaExceededError` and generic write exceptions, returning `{ ok: false, error: 'quota' | 'write' }`.
    - _Requirements: 5.1, 5.2, 5.6_


- [ ] 4. Implement the Validation module
  - [-] 4.1 Implement per-field and aggregate validation functions
    - Implement `validateItemName(raw)` (trim; require 1–100 chars), `validateAmount(raw)` (finite number in [0.01, 999999999.99]), and `validateCategory(raw)` (one of Food/Transport/Fun).
    - Implement `validateForm({ name, amount, category })` returning `{ valid, values, fieldMessages }` so every offending field can be flagged at once, using the specific amount range message.
    - Keep all validation functions pure (no DOM access).
    - _Requirements: 1.1, 1.4, 1.5_


- [ ] 5. Implement the Calculation module
  - [~] 5.1 Implement balance and category calculation functions
    - Implement `computeTotalBalance(transactions)` → sum rounded to 2 decimals, clamped to [-999999999.99, 999999999.99], `0.00` for the empty list.
    - Implement `computeCategoryTotals(transactions)` → `{ Food, Transport, Fun }` sums.
    - Implement `computeCategoryPercentages(categoryTotals)` → one entry per non-zero category, each rounded to one decimal, remainder assigned to the largest slice so displayed percentages sum to exactly 100.0%.
    - Keep all calculation functions pure.
    - _Requirements: 3.1, 3.5, 4.1, 4.5_


- [ ] 6. Checkpoint - pure modules complete
  - Ensure the page still loads without errors and the State, Storage, Validation, and Calculation modules are callable from the console. Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement the Render module (balance, list, chart)
  - [ ] 7.1 Implement `renderBalance(transactions)`
    - Update `#balance-display` using `computeTotalBalance`; format to two decimals; show `0.00` when empty; add a negative style class and visible negative indication when below zero.
    - Keep the renderer idempotent.
    - _Requirements: 3.1, 3.4, 3.6_

  - [ ] 7.2 Implement `renderList(transactions)`
    - Rebuild `#transaction-list` with one row per transaction showing item name, amount formatted to exactly two decimals, category, and a delete control carrying the transaction `id`.
    - Render the empty-state message when the list is empty; ensure the container scrolls via CSS (`max-height` + `overflow-y: auto`).
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_


  - [ ] 7.4 Implement `renderChart(transactions)` with empty state
    - Build/update the Chart.js pie chart from `computeCategoryPercentages`, showing only non-zero categories.
    - Show `#chart-empty` and render no slices when there is no spending or total is 0; handle Chart.js being unavailable by showing the chart empty/unavailable message without blocking list/balance.
    - _Requirements: 4.1, 4.4, 4.5_

  - [ ] 7.5 Implement `renderAll(transactions)`
    - Call `renderBalance`, `renderList`, and `renderChart` so a single call re-renders all three views from the same state.
    - _Requirements: 3.1, 4.2, 4.3_

- [ ] 8. Implement the Controller and wire events through `init()`
  - [ ] 8.1 Implement `handleFormSubmit(event)`
    - Prevent default, run `validateForm`, and on failure show per-field messages while retaining entered values and not mutating state.
    - On success create a `Transaction`, add it to state, call `saveTransactions`, roll back the in-memory add and show the "changes could not be saved" message on persist failure, clear the form on success, and call `renderAll`.
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 5.1, 5.6, 6.4_

  - [ ] 8.2 Implement `handleListClick(event)` via event delegation
    - Delegate clicks on `#transaction-list`; when a delete control is clicked, remove the transaction by `id`, call `saveTransactions`, roll back and show the save-failure message on persist failure, and call `renderAll`.
    - _Requirements: 2.4, 5.2, 5.6, 6.5_

  - [ ] 8.3 Implement `init()` with feature detection and first render
    - Run feature detection (`window.localStorage`, `<canvas>`/Chart.js, id generation); on a missing feature show the unsupported-browser message in `#app-message` and skip rendering without touching stored data.
    - On success, load from storage, show the corrupt-data message when the loader flags it, bind form submit and list click handlers, and perform the first `renderAll`; wrap the initial render so an unexpected exception surfaces the unsupported/failed message instead of a blank page.
    - _Requirements: 5.3, 5.5, 6.6_


- [ ] 9. Final integration and presentation polish
  - [ ] 9.1 Polish styling, visual hierarchy, empty states, and messages
    - Refine `css/styles.css` for a clean visual hierarchy: balance prominent and above the list and chart, readable body text (≥14px), styled transaction rows and delete controls, and a distinct negative-balance style.
    - Style the empty-state messages (list and chart) and the shared `#app-message` region (corrupt-data, save-failure, unsupported-browser) so they are clearly visible.
    - Confirm exactly one CSS file in `css/` and one JS file in `js/` and that all views stay synchronized after add/delete.
    - _Requirements: 2.5, 3.6, 4.4, 5.5, 5.6, 6.1, 6.3, 6.6_

- [ ] 10. Final checkpoint - manual verification pass
  - Walk the design's manual verification checklist (add flow, validation, list + delete, balance, chart, persistence resilience, platform constraints) in a target browser and spot-check the others. Ensure all checks pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional. They map to the design's correctness properties and can be run ad hoc against the pure Validation, Calculation, and Storage functions; per project constraints no test framework or build tooling needs to be set up.
- Testing is primarily the manual verification checklist in the design's Testing Strategy.
- Each task references specific requirement sub-clauses for traceability.
- Checkpoints ensure incremental validation at natural breaks.
- The single `js/app.js` groups the modules by comment sections to honor the one-JS-file constraint; each step wires its module into the running app so there is no orphaned code.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["3.1", "3.2", "4.1", "5.1"] },
    { "id": 3, "tasks": ["3.3", "4.2", "5.2", "7.1", "7.2", "7.4"] },
    { "id": 4, "tasks": ["7.3", "7.5"] },
    { "id": 5, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 6, "tasks": ["8.4"] },
    { "id": 7, "tasks": ["9.1"] }
  ]
}
```
