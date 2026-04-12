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

# Web environment
The web environment is for production

# Attributions
- **[MMIX](https://www-cs-faculty.stanford.edu/~knuth/mmix.html)** — A 64-bit RISC architecture designed by [Donald E. Knuth](https://www-cs-faculty.stanford.edu/~knuth/) as the successor to MIX for *The Art of Computer Programming*.
- **[MMIXware](https://www-cs-faculty.stanford.edu/~knuth/mmix.html)** — The official MMIX software package (assembler, simulator, and related tools) by Donald E. Knuth, distributed as CWEB literate programs. Also available on [CTAN](https://ctan.org/pkg/mmixware).
- **[landrun](https://github.com/zouuup/landrun)** — A lightweight Linux sandbox using the kernel's native Landlock LSM, by [@Zouuup](https://github.com/zouuup).
