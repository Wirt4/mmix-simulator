#!/bin/sh
docker compose -f .devcontainer/compose.yaml up -d --build
docker compose -f .devcontainer/compose.yaml exec -w /workspaces/mmix-simulator rails-app bash -c 'eval "$(~/.local/bin/mise activate bash)" && bundle install'
docker compose -f .devcontainer/compose.yaml exec -w /workspaces/mmix-simulator rails-app npm install
docker compose -f .devcontainer/compose.yaml exec rails-app bash

