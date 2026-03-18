 # 001 — Functional Fixes from Auth Audit

  ## Context

  The auth features (registration, RBAC, admin user management) are implemented but have several deviations
  from the spec in `.tasks/user-auth-features.md`. This task addresses all broken or missing behavior.

  ## Objective

  Fix the broken edit form, unify authorization through the `Authorization` concern, add missing guards and UI
   elements, and fill in missing configuration (routes, rate limiting, seeds).

  ## Scope

  ### 1. `app/controllers/concerns/authorization.rb`

  Update `require_role` to `head :forbidden` instead of redirecting to root with alert. The unauthenticated
  case is already handled by `require_authentication` (from `Authentication` concern) which runs first as a
  default `before_action` and redirects to login. So `require_role` only ever sees logged-in users — if the
  role doesn't match, it's a 403.

  Note the distinction: **401-like behavior** (not logged in) is handled by `Authentication`; **403** (logged
  in, wrong role) is handled by `Authorization`. These are separate concerns and should stay that way.

  ### 2. `app/controllers/users_controller.rb`

  - Replace the hand-rolled `require_admin` / `current_is_admin?` with `require_role :admin` at the class
  level.
  - Delete private methods: `require_admin`, `current_is_admin?`.
  - Remove the redundant `require_admin` call inside the `index` action body.
  - `update`: use strong params (`params.require(:user).permit(:role)`) instead of `params.dig(:user, :role)`.

  ### 3. `app/views/users/edit.html.erb`

  The submit button is currently outside the `form_with` block, so the form cannot be submitted. Move the
  submit button inside the block.

  ### 4. `app/views/users/index.html.erb`

  Add a delete button for each user in the table row. Use `button_to` with `method: :delete` (matching
  existing patterns).

  ### 5. `config/routes.rb`

  Change `resources :users` → `resources :users, only: [:index, :edit, :update, :destroy]`.

  ### 6. `app/controllers/registrations_controller.rb`

  Add rate limiting on `create`, matching the existing `SessionsController` pattern:
  ```ruby
  rate_limit to: 10, within: 3.minutes, only: :create,
    with: -> { redirect_to new_registration_path, alert: "Try again later." }

  7. db/seeds.rb

  Add idempotent admin seed:
  User.find_or_create_by!(email_address: "admin@example.com") do |u|
    u.user_name = "admin"
    u.password = "changeme123"
    u.role = :admin
  end

  Non-goals

  - Test changes (next task)
  - README / TomDoc updates (next task, nice-to-have)
  - Any UI/layout changes beyond the edit form fix and delete button
  - Updating the spec document itself

  Constraints

  - require_role is the single authorization mechanism. No per-controller hand-rolled alternatives.
  - Auth chain order: require_authentication (before_action from Authentication) → require_role (before_action
   from Authorization). The first redirects to login; the second returns 403.
  - Last-admin guards remain controller-level only (not model-level).

  ---

  **What I wrote and why:** This brief covers all 10 functional deviations in one pass. The changes are
  tightly coupled — updating the `Authorization` concern necessitates updating `UsersController`, and both are
   small. The edit form and index view fixes are trivial but blocking.

  **Tradeoffs/assumptions:**
  - I kept the `Authorization` concern generic (`require_role` with splat args) rather than hardcoding
  admin-only behavior — it stays reusable if more roles appear.
  - The 403 response is a bare `head :forbidden` with no body/message. If you later want a rendered error
  page, that's a separate concern.
  - The rate limit redirect for registration goes to `new_registration_path` (back to the signup form),
  mirroring how sessions handles it.


