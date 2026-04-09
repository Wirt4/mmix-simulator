#!/bin/sh
docker compose run --rm test bash -c "rm -f storage/test.sqlite3 storage/test.sqlite3_* && bin/rails db:create db:migrate && bin/rails test && npm test"
