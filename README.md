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

## Role System

There are two roles in the database and one implicit "guest" concept:

- **Guest** — an unauthenticated visitor (`Current.user.nil?`). Not stored in the database. Guests can use the console (write and run MMIX assembly) but cannot save work.
- **User** (integer `1`, default) — a registered, authenticated user. Can use the console; future: save and load programs.
- **Admin** (integer `2`) — can manage users via the admin user management interface (`/users`).

The enum starts at `1` (not `0`) because there is no guest role in the database — guest is purely a runtime concept.

### Seeding an admin account

```sh
bin/rails db:seed
```

This creates `admin@example.com` with password `changeme123` and the admin role. The seed is idempotent — safe to run multiple times.

### What each role can do

| Action | Guest | User | Admin |
|---|---|---|---|
| Use the MMIX console | ✓ | ✓ | ✓ |
| Save/load programs | — | future | future |
| Manage users | — | — | ✓ |

### Enum integer mapping

```ruby
enum :role, { user: 1, admin: 2 }
```

`0` is intentionally unused. There is no guest role in the database.

---

Localhosting

# Build and start the containers                       
  docker compose -f .devcontainer/compose.yaml up -d --build                                              
                                                                                                          
  # Shell into the rails-app container                                                                    
  docker compose -f .devcontainer/compose.yaml exec rails-app bash                                        
                  
# Inside the container
  * cd /workspaces/mmix-simulator
  * bin/rails server

# Testing
## All
With the container running and working from inside `workspaces/mmix-simulator`,
`bin/rake test`
## Ruby only
Inside the container, run `bin/rails test`
## JS only (verbose)
(requires npm)
run `npx vitest run` to get verbose output
