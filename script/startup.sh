#!/bin/sh
docker compose build dev && docker compose run --rm dev bash
