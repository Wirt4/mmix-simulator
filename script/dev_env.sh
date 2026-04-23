#!/bin/sh
docker compose --profile dev run --rm --service-ports development \
  bash -c "cp /opt/wasm-cache/mmix.js /opt/wasm-cache/mmix.wasm public/ && cp /opt/wasm-cache/module.d.ts app/javascript/types/module.d.ts && exec bash"
