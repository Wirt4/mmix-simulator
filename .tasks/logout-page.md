---
  Context: DELETE /session destroys a session but isn't reachable from a browser
   address bar. QA needs a navigable URL to log out.

  Objective: Add a GET /session/logout page that renders a form button to DELETE
   /session.

  Scope:

  - config/routes.rb — add get "session/logout", to: "sessions#logout", as:
  :logout (inside or alongside the existing resource :session)
  - SessionsController — add logout action (renders view, no logic needed).
  Allow unauthenticated access to it (add :logout to the existing
  allow_unauthenticated_access list).
  - app/views/sessions/logout.html.erb — minimal page: a button_to "Log out",
  session_path, method: :delete
  - test/requests/sessions_controller_test.rb — add test that GET logout_path
  returns success

  Non-goals: Styling, nav bar, redirect-after-logout changes.
