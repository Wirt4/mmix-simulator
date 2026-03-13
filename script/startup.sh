#!/bin/sh
docker compose -f .devcontainer/compose.yaml up -d --build                                              
docker compose -f .devcontainer/compose.yaml exec rails-app bash                                        

