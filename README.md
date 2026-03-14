# README

This README would normally document whatever steps are necessary to get the
application up and running.

Things you may want to cover:

* Ruby version

* System dependencies

* Configuration

* Database creation

* Database initialization

* How to run the test suite

* Services (job queues, cache servers, search engines, etc.)

* Deployment instructions

* ...

Localhosting

# Build and start the containers                       
  docker compose -f .devcontainer/compose.yaml up -d --build                                              
                                                                                                          
  # Shell into the rails-app container                                                                    
  docker compose -f .devcontainer/compose.yaml exec rails-app bash                                        
                  
# Inside the container
  * cd /workspaces/mmix-simulator
  * bin/setup --skip-server
  * bin/rails server -b 0.0.0.0

# Testing
  With the container running and working from inside `workspaces/mmix-simulator`,
`bin/rails test`
