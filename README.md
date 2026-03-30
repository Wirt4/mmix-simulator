# README

This README would normally document whatever steps are necessary to get the
application up and running.
Localhosting

# Build and start the containers                       
  docker compose up -d --build                                              
  # Shell into the rails-app container                                                                    
  docker compose exec rails-app bash                                        
  # Shut down the container
docker compose down

# Inside the container
  * cd /workspaces/mmix-simulator
  * bin/rails server

__alternatively__  run `sh scripts/setup` to get up, running and in the shell.

# Testing
## All
With the container running and working from inside `workspaces/mmix-simulator`,
`bin/rake test`
## Ruby only
Inside the container, run `bin/rails test`
## JS only (verbose)
(requires npm)
run `npx vitest run` to get verbose output
