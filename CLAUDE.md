# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Three-language architecture

The repo combines three layers that must be understood together:

1. **C / WASM (`wasm/`)** — the MMIX simulator itself. Built from Knuth's `mmixware` CWEB sources plus Ruckert's `mmixlib` change files (both git submodules under `wasm/vendor/`). A thin glue layer (`wasm/src/glue.c`, `glue.h`) exposes a fetch/execute-style API to JavaScript via Emscripten. Compiled to `mmix.js` + `mmix.wasm` and copied into `public/`.
2. **TypeScript (`app/javascript/`)** — loads the WASM module and drives the IDE UI. Entry point is `application.ts`. The Stimulus controller `controllers/ide_facade_controller.ts` wires together a `Simulator` (TS wrapper over the WASM ccall surface), a `ModuleAdapter` (`moduleAdapter/`, built from `wasm/factory.ts`), and IDE panels (`ide/input.ts`, `listing.ts`, `output_panel.ts`, `registers*.ts`, `arguments.ts`). All TS communicates with WASM through the `ModuleAdapter` interface — never call the Emscripten module directly from feature code.
3. **Rails (`app/`, `config/`)** — Rails 8.1 on Ruby 4.0.1, sqlite3 in dev/test, pg in prod. Handles sessions, user accounts, and persisting MMIXAL programs (`MmixalProgram` model). The view layer renders the IDE shell; Stimulus controllers take over from there. Routes are in `config/routes.rb` and are intentionally minimal.

The data flow is: user edits MMIXAL in a Rails view → Stimulus controller hands source to `Simulator` → `ModuleAdapter` calls into WASM via `ccall`/`cwrap` → WASM assembles and runs the program → results flow back up and the controller updates registers/output/listing panels.

## Common commands

All commands run inside the dev Docker container (WORKDIR `/rails`). Shell in with `script/dev_env.sh`, or start the server with `script/local_host.sh` (boots at `localhost:3000`).

### Testing
- `bin/rails test` — Ruby/Rails tests
- `bin/rails test test/path/to/file_test.rb` — single file
- `bin/rails test test/path/to/file_test.rb:42` — single test by line
- `npm test` — TypeScript tests via Vitest
- `npm run test -- --run test/javascript/ide_facade_snapshot.test.ts` — single TS file
- `npm run test -- --run -u test/javascript/ide_facade_snapshot.test.ts` — update snapshots (only after an intentional UI change; snapshots in `test/javascript/__snapshots__/` are committed)
- `bin/rake test` — full suite (Ruby + `npm run typecheck`)
- `script/run_test.sh` — fresh container, recreates the test DB, runs everything

### Lint / typecheck
- `bin/rubocop` — Ruby (rubocop-rails-omakase, excludes `wasm/**/*`)
- `npm run lint` — TypeScript (ESLint)
- `npm run typecheck` — `tsc --noEmit`

### Build
- `npm run build` — bundles `app/javascript/application.ts` via esbuild into `app/assets/builds/`
- `cd wasm && make wasm` — full WASM build, drops `mmix.js`/`mmix.wasm` into `public/`. The dev container caches a prebuilt copy at `/opt/wasm-cache/`; both startup scripts copy from there into `public/` before `bin/rails server` runs.

### WASM (run from `wasm/`)
- `make` (default `test`) — builds `libmmix.a` via ctangle + clang and runs integration tests against the real lib
- `make analyze` — `cppcheck` + `clang --analyze` across `src/` and `test/`
- `make clean` — wipes `build/mmixlib/` and `build/wasm/`

After cloning, run `git submodule update --init --recursive` to fetch `mmixware`, `mmixlib`, `unity`, and `cmock`.

## Conventions and gotchas

- Controller tests go in `test/requests/`, integration/system tests in `test/integration/`.
- Tests run inside Docker (dev stage) at WORKDIR `/rails` — local Ruby/Node versions may not match.
- Snapshot tests in `test/javascript/ide_facade_snapshot.test.ts` guard the IDE DOM against regressions and use a mocked WASM adapter; update them only when the change is intentional.
- Rubocop excludes `wasm/**/*` — the C build there has its own analysis via `make analyze`.
- `plan.md` at the repo root tracks the current in-flight refactor. Update it immediately after every edit related to that plan.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical labels at their default names (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
