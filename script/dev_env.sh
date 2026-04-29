#!/bin/sh
docker compose --profile dev run --rm --service-ports development \
  bash -c "cp /opt/wasm-cache/mmix.js /opt/wasm-cache/mmix.wasm public/ && exec bash"
