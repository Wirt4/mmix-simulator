# README
The project maintains two environments: development and web

# Development environment
The development ("dev") environment is for testing User Interface and manual Quality Assurance. 
Database records in this environment should persist (user accounts, user's assets and records).

## Usage
 Run `docker compose --profile dev up` to start the server at `localhost:3000`
 Run `docker compose --profile dev run --rm --service-ports development bash` to shell into the environment
(Alternatively, there are the scripts 'localhost' and 'dev_env' in the `script` directory for a little quality of life)

## Testing
`bin/rails test` for Ruby
`npx vitest` for TypeScript
or `bin/rake test` for the whole suite 

## Linting
`bin/rubocop` for Ruby
`npx eslint .` for TypeScript

# Web environment
The web environment is for production

# Attributions
- **[MMIX](https://www-cs-faculty.stanford.edu/~knuth/mmix.html)** — A 64-bit RISC architecture designed by [Donald E. Knuth](https://www-cs-faculty.stanford.edu/~knuth/) as the successor to MIX for *The Art of Computer Programming*.
- **[MMIXware](https://www-cs-faculty.stanford.edu/~knuth/mmix.html)** — The official MMIX software package (assembler, simulator, and related tools) by Donald E. Knuth, distributed as CWEB literate programs. Also available on [CTAN](https://ctan.org/pkg/mmixware).
- **[landrun](https://github.com/zouuup/landrun)** — A lightweight Linux sandbox using the kernel's native Landlock LSM, by [@Zouuup](https://github.com/zouuup).
