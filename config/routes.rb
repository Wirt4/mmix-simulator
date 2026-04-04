Rails.application.routes.draw do
  # ── Authentication (all HTML) ──────────────────────────────────
  # GET  /session/new      → sessions#new        (login form)
  # POST /session          → sessions#create      (submit login)
  # DELETE /session         → sessions#destroy     (end session)
  resource :session, only: [ :new, :create, :destroy ]
  # GET /logout             → sessions#logout      (logout page)
  get "logout", to: "sessions#logout", as: :logout

  # ── Registration & password reset (all HTML) ───────────────────
  # GET  /registration/new → registrations#new    (signup form)
  # POST /registration     → registrations#create (submit signup)
  resource :registration, only: [ :new, :create ]
  # GET    /passwords/new        → passwords#new    (request reset form)
  # POST   /passwords            → passwords#create (submit reset request)
  # GET    /passwords/:token     → passwords#show   (verify token)
  # GET    /passwords/:token/edit → passwords#edit  (new password form)
  # PATCH  /passwords/:token     → passwords#update (submit new password)
  # DELETE /passwords/:token     → passwords#destroy
  resources :passwords, param: :token, only: [ :new, :create, :update, :edit ]

  # ── User management (all HTML) ─────────────────────────────────
  # GET    /users           → users#index          (user list)
  # GET    /users/:id/edit  → users#edit           (edit user form)
  # PATCH  /users/:id       → users#update         (submit edit)
  # DELETE /users/:id       → users#destroy        (remove user)
  resources :users, only: [ :index, :edit, :update, :destroy ]

  # ── Health check (data-only, no view) ──────────────────────────
  # GET /up                 → rails/health#show    (returns HTTP status)
  get "up" => "rails/health#show", as: :rails_health_check

  # ── Root ───────────────────────────────────────────────────────
  # GET /                   → console#index        (main page)
  root "console#index"
end
