# User Auth Features: Registration, Profile Management, Role-Based Access Control

## Context

Rails 8.1 app (SQLite, Importmap, Hotwire, Minitest). Authentication is already fully implemented via Rails 8 generator: `User` model with `has_secure_password`, `Session` model, `Authentication` concern (cookie-based sessions), `SessionsController`, `PasswordsController`, password reset mailer. The `users` table has `email_address`, `password_digest`, `user_name`. The `ConsoleController` (root route) allows unauthenticated access. There is no `UsersController`, no registration flow, no role system, and no profile editing.

Existing test patterns: Minitest, integration tests with `ActionDispatch::IntegrationTest`, `SessionTestHelper` for `sign_in_as`/`sign_out`, fixtures in `test/fixtures/users.yml` with bcrypt passwords.

## Architecture Decisions

**Roles**: Integer enum on `users` table (`guest: 0, user: 1, admin: 2`). No join tables, no gems. Three fixed roles do not warrant more complexity.

**Authorization**: A new `Authorization` concern in `app/controllers/concerns/` providing `require_role` and `admin?`/`user?`/`guest?` helper methods. No Pundit/CanCanCan -- overkill for three roles.

**Registration**: Open signup. New users default to `user` role. No email verification (add later if needed).

**Profile**: Users edit their own account via a singular `resource :profile` route backed by a `ProfilesController`. This avoids conflating admin user-management (`resources :users`) with self-service profile editing.

**Admin user management**: The existing `resources :users` route gets a `UsersController` restricted to admins, for listing/editing/deleting users and assigning roles.

**Password changes on profile**: Require current password to set a new one (via `update_password` action on `ProfilesController`, or inline in `update`).

## Database Migration

One migration: `AddRoleToUsers`

```ruby
add_column :users, :role, :integer, default: 1, null: false
# default: 1 = "user" role
```

Update fixtures to include `role` values (admin fixture needed for testing).

## Feature 1: User Registration

### Files to create
- `app/views/registrations/new.html.erb` -- signup form (user_name, email_address, password, password_confirmation)

### Files to modify
- `config/routes.rb` -- add `resource :registration, only: [:new, :create]`
- `app/controllers/registrations_controller.rb` -- new controller:
  - `allow_unauthenticated_access`
  - `new`: renders form
  - `create`: builds User with `user` role, calls `start_new_session_for` on success, redirects to root; re-renders form on failure
  - Rate-limit `create` (10 per 3 minutes, matching existing pattern)
- `app/views/sessions/new.html.erb` -- add "Sign up" link

### Security
- Strong params: permit only `user_name`, `email_address`, `password`, `password_confirmation`. Never permit `role`.
- `has_secure_password` handles bcrypt. Max password length 72 (bcrypt limit) already enforced in existing views.
- Rate limiting on create to prevent mass account creation.

## Feature 2: Profile Management

### Files to create
- `app/controllers/profiles_controller.rb` -- singular resource controller:
  - `show`: display current user's profile
  - `edit`: render edit form
  - `update`: update user_name, email_address; if password fields present, require `current_password` and update password
  - All actions require authentication (default behavior, no opt-out needed)
  - Operates on `Current.user` only -- no `params[:id]`, no authorization bypass
- `app/views/profiles/show.html.erb`
- `app/views/profiles/edit.html.erb`

### Files to modify
- `config/routes.rb` -- add `resource :profile, only: [:show, :edit, :update]`
- `app/views/layouts/application.html.erb` -- add nav with profile link, logout link (when authenticated), login/signup links (when not)
- `app/models/user.rb` -- add validations: `validates :email_address, presence: true, uniqueness: true` and `validates :user_name, presence: true` (currently no validations beyond `has_secure_password`)

### Security
- Password change requires `current_password` param verified via `User.authenticate_by` before allowing update.
- Strong params: never permit `role` in profile updates.
- Operates on `Current.user` exclusively -- no IDOR possible.

## Feature 3: Role-Based Access Control

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

    private

    def authorize_admin!
      redirect_to root_path, alert: "Not authorized." unless Current.user&.admin?
    end
  end
  ```
- `app/controllers/users_controller.rb` -- admin-only CRUD:
  - `require_role :admin`
  - `index`, `edit`, `update` (including role assignment), `destroy`
  - No `new`/`create` (registration handles user creation; admin can promote/demote via edit)
- `app/views/users/index.html.erb` -- user list with roles
- `app/views/users/edit.html.erb` -- edit form with role dropdown

### Files to modify
- `app/models/user.rb` -- add enum:
  ```ruby
  enum :role, { guest: 0, user: 1, admin: 2 }, default: :user, validate: true
  ```
- `app/controllers/application_controller.rb` -- include `Authorization`
- `config/routes.rb` -- `resources :users` already exists; just needs the controller
- `app/controllers/console_controller.rb` -- remains open (unauthenticated access). If guest role should restrict certain features, add that later.
- `app/views/layouts/application.html.erb` -- show "Admin" link in nav for admin users

### Security
- `require_role` runs after `require_authentication`, so role checks always have a valid `Current.user`.
- Admin cannot delete themselves (guard in `UsersController#destroy`).
- Role param permitted only in `UsersController` (admin context), never in registration or profile.
- Seed an initial admin user in `db/seeds.rb` (no admin registration path).

## Route Summary (final state)

```ruby
resource :session
resource :registration, only: [:new, :create]
resource :profile, only: [:show, :edit, :update]
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
  user_name: User One
  role: 1

admin:
  email_address: admin@example.com
  password_digest: <%= password_digest %>
  user_name: Admin User
  role: 2

guest:
  email_address: guest@example.com
  password_digest: <%= password_digest %>
  user_name: Guest User
  role: 0
```

### Test files to create
- `test/controllers/registrations_controller_test.rb`:
  - GET new renders form
  - POST create with valid params creates user, sets session, redirects to root
  - POST create with invalid params re-renders form, does not create user
  - POST create does not allow setting role via params
- `test/controllers/profiles_controller_test.rb`:
  - Requires authentication for all actions
  - GET show displays current user info
  - PATCH update changes user_name/email
  - PATCH update with password fields requires current_password
  - PATCH update rejects incorrect current_password
- `test/controllers/users_controller_test.rb`:
  - All actions require admin role
  - Non-admin gets redirected with alert
  - Admin can list, edit, update role, destroy users
  - Admin cannot destroy themselves
- `test/models/user_test.rb` (extend existing):
  - Role enum works (`.admin?`, `.user?`, `.guest?`)
  - Validations on email_address and user_name
  - Default role is `user`
- `test/controllers/concerns/authorization_test.rb`:
  - `require_role` blocks unauthorized roles
  - `require_role` allows authorized roles

### Seeds (`db/seeds.rb`)
Create a default admin account:
```ruby
User.find_or_create_by!(email_address: "admin@example.com") do |u|
  u.user_name = "Admin"
  u.password = "changeme123"
  u.role = :admin
end
```

## Non-Goals / Out of Scope
- Email verification on signup
- OAuth / social login
- Granular permissions beyond three roles
- User avatar / profile picture
- Account deletion by user (admin-only for now)
- API authentication (this is session/cookie only)
- Styling beyond matching existing minimal patterns
