# User Auth Features: Registration, Role-Based Access Control, Admin User Management

## Context

Rails 8.1 app (SQLite, Importmap, Hotwire, Minitest). Authentication is already fully implemented via Rails 8 generator: `User` model with `has_secure_password`, `Session` model, `Authentication` concern (cookie-based sessions), `SessionsController`, `PasswordsController`, password reset mailer. The `users` table has `email_address`, `password_digest`, `user_name`, and `role` (integer, default 1, not null). The `ConsoleController` (root route) allows unauthenticated access. There is no `UsersController`, no registration flow, and no role system.

The `role` column migration has already been applied. The schema has `role` with `default: 1, null: false` and a unique index on `email_address`.

Existing test patterns: Minitest, controller tests with `ActionDispatch::IntegrationTest`, `SessionTestHelper` for `sign_in_as`/`sign_out`, fixtures in `test/fixtures/users.yml` with bcrypt passwords.

## Architecture Decisions

**Guest concept**: "Guest" is an unauthenticated visitor (`Current.user.nil?`), not a database role. There is no guest enum value. Guests can use the console (edit and run code) but cannot save work. The guest concept exists to lower friction — anyone can use the app immediately without account creation.

**Roles**: Integer enum on `users` table with two values: `user: 1, admin: 2`. No join tables, no gems. The numbering starts at 1 (not 0) because there is no guest role in the database. Default is `user` (1). This must be documented in the enum definition, the README, and tested in specs.

**Authorization**: A new `Authorization` concern in `app/controllers/concerns/` providing a reusable `require_role` class method. No Pundit/CanCanCan — overkill for two roles. Included in `ApplicationController` as scaffolding for future role gating across controllers.

**Registration**: Open signup. New users default to `user` role. No email verification (add later if needed). The intent is to tie saved programs to user accounts (save feature is future scope).

**Profile management**: Deferred to a future iteration. Not needed until there is a visible feature that benefits from it.

**Admin user management**: A `UsersController` restricted to admins for viewing users, editing roles, and deleting users.

**Deleted user with stale cookie**: Treated the same as "never logged in" — redirect to login page. No special "account deleted" message in this iteration.

**`user_name` uniqueness**: Case-insensitive, normalized (strip + downcase), with both model validation and database unique index.

**No UI changes to console or layout**: No nav bar, no username display. The console page remains unchanged. These are future scope.

## Database Migration

Already applied. The `users` table has:

```ruby
t.integer "role", default: 1, null: false
```

- `1` = `user` role (default)
- `2` = `admin` role

**Additional migration needed**: Add a unique index on `user_name` (case-insensitive). Add normalization in the model (`normalizes :user_name, with: ->(n) { n.strip.downcase }`, matching the existing `email_address` pattern).

## Feature 1: User Registration

### Files to create
- `app/controllers/registrations_controller.rb` — new controller:
  - `allow_unauthenticated_access`
  - `new`: renders form
  - `create`: builds User with default `user` role, calls `start_new_session_for` on success, redirects to root; re-renders form on failure
  - Rate-limit `create` (10 per 3 minutes, matching existing pattern)
  - TomDoc on all public methods
- `app/views/registrations/new.html.erb` — signup form (user_name, email_address, password, password_confirmation)

### Files to modify
- `config/routes.rb` — add `resource :registration, only: [:new, :create]`
- `app/views/sessions/new.html.erb` — add "Sign up" link

### Security
- Strong params: permit only `user_name`, `email_address`, `password`, `password_confirmation`. Never permit `role`.
- `has_secure_password` handles bcrypt. Max password length 72 (bcrypt limit) already enforced in existing views.
- Rate limiting on create to prevent mass account creation.

## Feature 2: Role-Based Access Control

### Files to create
- `app/controllers/concerns/authorization.rb`:
  ```ruby
  module Authorization
    extend ActiveSupport::Concern

    class_methods do
      def require_role(*roles, **options)
        before_action(**options) do
          unless roles.include?(Current.user.role.to_sym)
            redirect_to root_path, alert: "Not authorized."
          end
        end
      end
    end
  end
  ```
  TomDoc on the module and `require_role` method.

### Files to modify
- `app/models/user.rb` — add:
  - `enum :role, { user: 1, admin: 2 }, default: :user, validate: true`
  - `validates :email_address, presence: true, uniqueness: true`
  - `validates :user_name, presence: true, uniqueness: true`
  - `normalizes :user_name, with: ->(n) { n.strip.downcase }`
  - TomDoc on the class explaining the role system
- `app/controllers/application_controller.rb` — include `Authorization`
- `app/controllers/console_controller.rb` — remains open (unauthenticated access), no changes needed

### Security
- `require_role` runs after `require_authentication` (which is a `before_action` from `Authentication`), so role checks always have a valid `Current.user`.
- Role param never permitted in registration.

## Feature 3: Admin User Management

### Files to create
- `app/controllers/users_controller.rb` — admin-only controller:
  - `require_role :admin`
  - `index`: list all users with their roles
  - `edit`: render edit form with role dropdown
  - `update`: update user role. Controller-level guard: cannot demote the last admin
  - `destroy`: delete a user. Controller-level guards: cannot delete self, cannot delete the last admin
  - TomDoc on all public methods
- `app/views/users/index.html.erb` — user list with roles
- `app/views/users/edit.html.erb` — edit form with role dropdown

### Files to modify
- `config/routes.rb` — change `resources :users` to `resources :users, only: [:index, :edit, :update, :destroy]`

### Security
- All actions require admin role via `require_role :admin`.
- Admin cannot delete themselves (controller-level guard in `destroy`).
- Admin cannot demote the last remaining admin (controller-level guard in `update`).
- Last-admin guards are controller-level only — `rails console` retains full power for developers.
- Role param permitted only in `UsersController` (admin context), never in registration.

### Seeds (`db/seeds.rb`)
Create a default admin account:
```ruby
User.find_or_create_by!(email_address: "admin@example.com") do |u|
  u.user_name = "admin"
  u.password = "changeme123"
  u.role = :admin
end
```

## Route Summary (final state)

```ruby
resource :session
resource :registration, only: [:new, :create]
resources :passwords, param: :token
resources :users, only: [:index, :edit, :update, :destroy]  # admin only
root "console#index"
```

## Testing Approach

### Fixtures (`test/fixtures/users.yml`)
Add role values and an admin fixture:
```yaml
<% password_digest = BCrypt::Password.create("password") %>
one:
  email_address: one@example.com
  password_digest: <%= password_digest %>
  user_name: userone
  role: 1

two:
  email_address: two@example.com
  password_digest: <%= password_digest %>
  user_name: usertwo
  role: 1

admin:
  email_address: admin@example.com
  password_digest: <%= password_digest %>
  user_name: adminuser
  role: 2
```

### Test files to create

- `test/models/user_test.rb` (extend existing):
  - Role enum: `.admin?` and `.user?` predicates work correctly
  - Default role is `user` (integer value 1)
  - Enum rejects invalid role values
  - Validations: `email_address` presence and uniqueness
  - Validations: `user_name` presence and uniqueness (case-insensitive)
  - `user_name` normalization: strip and downcase

- `test/controllers/registrations_controller_test.rb`:
  - GET new renders form
  - POST create with valid params creates user, sets session, redirects to root
  - POST create with invalid params re-renders form, does not create user
  - POST create does not allow setting role via params
  - New user defaults to `user` role

- `test/controllers/users_controller_test.rb`:
  - All actions require admin role
  - Non-admin gets redirected with "Not authorized." alert
  - Admin can list users
  - Admin can edit and update a user's role
  - Admin cannot destroy themselves
  - Admin cannot destroy the last admin
  - Admin cannot demote the last admin via update
  - Admin can destroy a non-admin user

- `test/controllers/concerns/authorization_test.rb`:
  - `require_role` blocks unauthorized roles
  - `require_role` allows authorized roles

### No integration tests this iteration
Integration tests will be added when there is a more complete feature to integrate (e.g., save/load programs). This iteration focuses on model-level and controller-level tests only.

## Documentation

- **TomDoc**: All new public methods and classes must have TomDoc annotations. This includes `RegistrationsController`, `UsersController`, `Authorization` concern, and any new model methods.
- **README**: Add a section explaining:
  - The role system (two roles: `user` and `admin`; guest = unauthenticated)
  - How to seed an admin account (`db/seeds.rb`)
  - What each role can do (guest: use console; user: use console + future save; admin: manage users)
  - The enum integer mapping (`user: 1, admin: 2`) and why there is no `0`

## Non-Goals / Out of Scope
- Profile management (edit username, email, password) — deferred
- Nav bar / layout changes — deferred
- Username display in UI — deferred
- Saving/loading programs — deferred (the motivating feature for user accounts)
- Email verification on signup
- OAuth / social login
- Granular permissions beyond two roles
- User avatar / profile picture
- Account deletion by user (admin-only for now)
- API authentication (this is session/cookie only)
- Styling beyond matching existing minimal patterns
- "Account deleted" messaging for stale sessions
- Model-level last-admin guards (controller-level only)
- Integration tests
