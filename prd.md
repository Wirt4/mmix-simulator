# Feature Branch Requirements

## Project
Migrate IDE UI from home-rolled textarea/overlay approach to CodeMirror 6.

## Background

The current input editor uses a `<textarea>` backed by a transparent highlight overlay `<div>`, with scroll sync and line numbers managed by `TextFormatController` and `Formatter`. This is fragile and limits future features (autocompletion, better UX). CodeMirror 6 handles all of this natively.

The listing panel uses a plain `<div>` with `textContent`. The output panel uses a `<textarea>`. Both will become read-only CodeMirror instances for visual consistency.

## What is changing

- **Input panel**: replaced by a CodeMirror `EditorView`. The Rails `<textarea name="source">` is kept but hidden, and CodeMirror writes its contents into it on every change so the existing form submit still works.
- **Listing panel**: `<div>` replaced by a read-only CodeMirror `EditorView`. `IListing` interface unchanged.
- **Output panel**: `<textarea>` replaced by a read-only CodeMirror `EditorView`. `IOutputPanel` interface unchanged.
- **Interfaces**: `highlight()` and `syncHighlightScroll()` removed from `IInput` — CodeMirror renders highlighting internally, so these methods are gone from the interface boundary.
- **Deletions**: `TextFormatController`, `Formatter`, the highlight overlay div, the old line-numbers gutter, and `syntax_highlighter.ts` are all removed once nothing references them.

## Definition of Done

A task is only "done" when **all tests pass inside the dev Docker container** — not on the host. Use `script/run_test.sh` (fresh container, recreates the test DB, runs the full suite) or, from inside `script/dev_env.sh`, run `bin/rake test` (Ruby + `npm run typecheck`) plus `npm test`. Host-side `npm test` does not count.

## Tasks

Tasks are sequential unless marked `(parallel with #N)`. Each task lists its goal, files touched, and the acceptance criterion that proves it's done.

Each task lists the files it touches and the acceptance criterion that proves it's done. Tasks are sequential unless marked `(parallel with #N)`.

- [ ] **3. Wire `CodeMirrorInput` into the view and the controller.** Files: `app/views/.../_text-field.html.erb`, `app/javascript/controllers/ide_facade_controller.ts`. In `_text-field.html.erb`: add a `<div data-ide-facade-target="editorContainer">` directly above the existing `<textarea>`; keep the `<textarea name="source">` but mark it `hidden` and remove its visible styling (it still submits with the form); remove the Stimulus action bindings `syncScroll`, `updateLineNumbers`, and `updateHighlight` from the textarea. In `ide_facade_controller.ts`: add `editorContainer` to `static targets`; in `connect()`, read initial content from `this.textareaTarget.value`, construct a `CodeMirrorInput` mounted on `this.editorContainerTarget`, and have it write changes back into `this.textareaTarget.value` so form submit picks them up; replace the construction of the old `Input` with `CodeMirrorInput`. Acceptance: the editor renders in the browser; edits persist through a form submit (`source` arrives on the server); tests pass inside Docker.
- [ ] **4. Remove superseded highlight machinery from the input panel.** Files: `_text-field.html.erb`, `app/javascript/controllers/text_format_controller.ts`. Remove the highlight overlay `<div>` and the line-numbers gutter element from `_text-field.html.erb`. Remove the `highlight` and line-numbers targets from `TextFormatController`. If `TextFormatController` no longer has any targets or any other panel depending on it, delete the controller file and its registration. Acceptance: line numbers appear exactly once in the input panel (rendered by CodeMirror, no duplicates); no console errors about missing Stimulus targets; tests pass inside Docker.
- [ ] **5. Update snapshot and unit tests.** Files: `test/javascript/ide_facade_snapshot.test.ts`, related TS tests. Update assertions so they check that `IdeFacadeController` constructs a `CodeMirrorInput`, not an `Input`. Regenerate the snapshot with `npm run test -- --run -u test/javascript/ide_facade_snapshot.test.ts` after confirming the new DOM is correct. Acceptance: `npm test` passes inside Docker; the new snapshot is committed.
- [ ] **6. Visual verification — input panel.** Confirm in a real browser that (a) CodeMirror inherits the listing panel's existing font stack and font size with no smaller-than-12px text, (b) the editor's rendered height matches the listing panel's height for the same number of lines both when empty and when loaded, and (c) line numbers render exactly once. Acceptance: a screenshot or short note in the PR confirming each of the three points.
- [ ] **7. Migrate the listing panel to read-only CodeMirror (parallel with #8).** Files: `app/javascript/ide/listing.ts`, the listing view partial. Mount a read-only `EditorView` into the listing container. Change `setContents()` to dispatch a doc-replace transaction instead of writing `textContent`. Keep the `IListing` interface unchanged. Acceptance: listing renders identically (same fonts, same line count, same monospace alignment); existing tests pass inside Docker.
- [ ] **8. Migrate the output panel to read-only CodeMirror (parallel with #7).** Files: `app/javascript/ide/output_panel.ts`, the output view partial. Mount a read-only `EditorView` into the output container. Update `setValue()` to dispatch a doc-replace transaction; update `clear()` to dispatch an empty-doc transaction. Keep the `IOutputPanel` interface unchanged. Acceptance: output renders identically; existing tests pass inside Docker.
- [ ] **9. Cleanup pass after all three panels are migrated.** Verify line numbers appear only in CodeMirror in every panel that has them. Verify scroll sync is handled by CodeMirror (no leftover scroll-sync handlers). Delete `syntax_highlighter.ts` if no file imports it (grep first). Delete the old `Input` class in `app/javascript/ide/input.ts` if no file imports it. Acceptance: `grep -r syntax_highlighter app/javascript test/javascript` returns nothing; same for the old `Input` class; full suite passes inside Docker.
- [ ] **10. Add MMIXAL autocompletion.** Files: `app/javascript/ide/mmixal_language.ts`. Add a CodeMirror autocompletion source. Completion candidates: every value of `OpCode` and every value of `AssemblerDirective` (both already imported in `mmixal_language.ts`). For operand hints, consult `wasm/vendor/mmixware/mmix-doc.w` (Knuth's documentation source) — only add operand templates if they fall out cleanly from that file; otherwise opcode names alone are acceptable for this task. Acceptance: typing the first letter of an opcode in the editor shows a completion menu containing it; tests pass inside Docker.

## Files of interest

| File | Role |
|---|---|
| `app/javascript/ide/code_mirror_input.ts` | New CodeMirror input (mostly complete) |
| `app/javascript/ide/mmixal_language.ts` | MMIXAL StreamLanguage + highlight style |
| `app/javascript/ide/input.interface.ts` | `IInput` — `highlight`/`syncHighlightScroll` removed |
| `app/javascript/ide/input.ts` | Old textarea implementation — delete in task 9 |
| `app/javascript/ide/listing.ts` | Listing panel — migrate in task 7 |
| `app/javascript/ide/output_panel.ts` | Output panel — migrate in task 8 |
| `app/javascript/controllers/ide_facade_controller.ts` | Wire in `CodeMirrorInput` in task 3 |
| `app/javascript/controllers/text_format_controller.ts` | Manages textarea highlight overlay — delete in task 4 if unused |
| `test/javascript/ide_facade_snapshot.test.ts` | Snapshot test — update in task 5 |
