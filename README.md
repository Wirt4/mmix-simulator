# README
The project maintains two development environments and three different programming language domains
The environments are `development` and `web`.
The frameworks are Ruby on Rails for the app structure, Node + Typescript for the JS, and C + web assembly for the MMIX Simulator itself.

Basically the idea is to compile the MMIX Simulator to WASM, which in turn the TS layer accesses and updates the DOM in the Rails View. The heavy lifting and machine simulation is contained in the wasm, and Rails can do what it does best: manage sessions, user accounts and document tracking.

# Development environment
The development ("dev") environment is for testing User Interface and manual Quality Assurance. 
Database records in this environment should persist (user accounts, user's assets and records).

## Usage
 Run `docker compose --profile dev up` to start the server at `localhost:3000`
 Run `docker compose --profile dev run --rm --service-ports development bash` to shell into the environment
(Alternatively, there are the scripts 'localhost' and 'dev_env' in the `script` directory for a little quality of life)

## Testing
`bin/rails test` for Ruby
`npm run test` for TypeScript
or `bin/rake test` for the whole suite (includes `npm run typecheck`) 

## Linting
`bin/rubocop` for Ruby
`npm run lint` for TypeScript

## C/WASM (wasm/)

The WASM layer compiles an MMIX simulator to WebAssembly. It uses
[mmixlib](https://gitlab.lrz.de/mmix/mmixlib) (Martin Ruckert's library
wrapper around Knuth's [mmixware](https://gitlab.lrz.de/mmix/mmixware))
as the simulator backend, with a thin glue layer (`src/glue.c`) exposing
functions to JavaScript via Emscripten.

### Prerequisites
- [cweb](https://ctan.org/pkg/cweb) — provides `ctangle`, needed to generate C from the CWEB literate sources
- [Emscripten](https://emscripten.org/) — for the `make wasm` target

### Submodules
After cloning, run `git submodule update --init --recursive` to fetch:
- `wasm/vendor/mmixware` — Knuth's MMIX assembler, simulator, and arithmetic/IO modules
- `wasm/vendor/mmixlib` — Ruckert's change files that decompose mmix-sim into a linkable C library
- `wasm/vendor/unity` / `wasm/vendor/cmock` — test frameworks

### Build targets (run from `wasm/`)
1. ` — ctangle CWEB sources and compile into a static library
2. `make mocks` — CMock generates mock `.c`/`.h` in `test/unit/mocks/`
3. `make test-unit` — compiles and runs unit tests linked against mocks
4. `make test-integration` — links against the real `libmmix.a`
5. `make wasm` — compiles to WASM via emcc
6. `make analyze` - runs static code analysis against the C code
### Project layout
- `src/glue.c` / `src/glue.h` — public API exported to WASM
- `src/mmix_interface.h` — mmixlib function declarations (CMock mocks this)
- `src/libconfig.h` / `src/libimport.h` — mmixlib build configuration
- `build/mmixlib/` — generated C sources and compiled objects (gitignored)

# Web environment
The web environment is for production

# Attributions
- **[MMIX](https://www-cs-faculty.stanford.edu/~knuth/mmix.html)** — A 64-bit RISC architecture designed by [Donald E. Knuth](https://www-cs-faculty.stanford.edu/~knuth/) as the successor to MIX for *The Art of Computer Programming*.
- **[MMIXware](https://www-cs-faculty.stanford.edu/~knuth/mmix.html)** — The official MMIX software package (assembler, simulator, and related tools) by Donald E. Knuth, distributed as CWEB literate programs. Also available on [CTAN](https://ctan.org/pkg/mmixware) and [GitLab](https://gitlab.lrz.de/mmix/mmixware).
- **[mmixlib](https://gitlab.lrz.de/mmix/mmixlib)** — Change files by Martin Ruckert that decompose mmixware into a reusable C library with a fetch/execute API.
- **[landrun](https://github.com/zouuup/landrun)** — A lightweight Linux sandbox using the kernel's native Landlock LSM, by [@Zouuup](https://github.com/zouuup).
