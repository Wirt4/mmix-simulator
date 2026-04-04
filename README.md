# README

This README would normally document whatever steps are necessary to get the
application up and running.

Things you may want to cover:

* Database creation

* Database initialization

* How to run the test suite

* Services (job queues, cache servers, search engines, etc.)

* Deployment instructions

* ...

Localhosting

# Build the containers                       
  docker compose build dev                                              
  # Shell into the rails-app container without build
    docker compose run --rm --service-ports dev 
                  
__alternatively__  run `sh scripts/setup` to get up, running and in the shell.

# Inside the container
  * bin/rails server

# Testing
## All
With the container running and working from inside `workspaces/mmix-simulator`,
`bin/rake test`
## Ruby only
Inside the container, run `bin/rails test`
## JS only (verbose)
(requires npm)
run `npx vitest run` to get verbose output

# Attributions

- **[MMIX](https://www-cs-faculty.stanford.edu/~knuth/mmix.html)** — A 64-bit RISC architecture designed by [Donald E. Knuth](https://www-cs-faculty.stanford.edu/~knuth/) as the successor to MIX for *The Art of Computer Programming*.
- **[MMIXware](https://www-cs-faculty.stanford.edu/~knuth/mmix.html)** — The official MMIX software package (assembler, simulator, and related tools) by Donald E. Knuth, distributed as CWEB literate programs. Also available on [CTAN](https://ctan.org/pkg/mmixware).
- **[landrun](https://github.com/zouuup/landrun)** — A lightweight Linux sandbox using the kernel's native Landlock LSM, by [@Zouuup](https://github.com/zouuup).
