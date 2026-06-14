# Feature Branch Requirements

## Project
Migrate IDE UI from home-rolled textarea/overlay approach to CodeMirror 6.

## Background

The current input editor uses a `<textarea>` backed by a transparent highlight overlay `<div>`, with scroll sync and line numbers managed by `TextFormatController` and `Formatter`. This is fragile and limits future features (autocompletion, better UX). CodeMirror 6 handles all of this natively.
The listing panel uses a plain `<div>` with `textContent`. The output panel uses a `<textarea>`. Both will become read-only CodeMirror instances for visual consistency.


- **Input panel**: replaced by a CodeMirror `EditorView`. The Rails `<textarea name="source">` is kept but hidden, and CodeMirror writes its contents into it on every change so the existing form submit still works.
- **Listing panel**: `<div>` replaced by a read-only CodeMirror `EditorView`. `IListing` interface unchanged.
- **Output panel**: `<textarea>` replaced by a read-only CodeMirror `EditorView`. `IOutputPanel` interface unchanged.
- **Interfaces**: `highlight()` and `syncHighlightScroll()` removed from `IInput` — CodeMirror renders highlighting internally, so these methods are gone from the interface boundary.
- **Deletions**: `TextFormatController`, `Formatter`, the highlight overlay div, the old line-numbers gutter, and `syntax_highlighter.ts` are all removed once nothing references them.

## Definition of Done

A task is only "done" when **all tests pass inside the dev Docker container** — not on the host. Use `script/run_test.sh` (fresh container, recreates the test DB, runs the full suite) or, from inside `script/dev_env.sh`, run `bin/rake test` (Ruby + `npm run typecheck`) plus `npm test`. Host-side `npm test` does not count.

## Tasks
- [x] Wire `CodeMirrorInput` into the view and the controller.
- [x] In `_text-field.html.erb`: add a `<div data-ide-facade-target="editorContainer">` directly above the existing `<textarea>`
- [x] In `_text-field.html.erb`: mark <textarea name="source">`  `hidden` 
- [x] In `_text-field.html.erb`: remove and `<texarea name="source>`'s visible styling 
- [x] remove the Stimulus action bindings `syncScroll`, `updateLineNumbers`, and `updateHighlight`. 
- [x] In `ide_facade_controller.ts`: add `editorContainer` to `static targets`; in `connect()`,
- [x] In `_text-field.html.erb`, remove the line-numbers gutter element
- [x] In `TextFormatController`, remove the highlight and line-numbers targets
- [x] Migrate the listing panel to read-only CodeMirror 
- [ ] Migrate the output panel to read-only CodeMirror && Update `setValue()` and `clear()` accordingly. Keep the `IOutputPanel` interface unchanged.

