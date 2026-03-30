#!/bin/sh
docker compose up -d --build
docker compose  exec -w /workspaces/mmix-simulator rails-app bash -c 'eval "$(~/.local/bin/mise activate bash)" && bundle install'
docker compose exec rails-app npm install
docker compose exec -w /workspaces/mmix-simulator rails-app bash
