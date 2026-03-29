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

# Build and start the containers                       
  docker compose build dev                                              
  # Shell into the rails-app container                                                                    
  docker compose run --rm dev bash
                  
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
