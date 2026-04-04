#!/bin/sh
docker compose up dev && docker compose run --rm --service-ports dev bash
