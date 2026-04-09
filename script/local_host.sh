#!/bin/sh
docker compose run --rm --service-ports development bin/rails server -b 0.0.0.0
