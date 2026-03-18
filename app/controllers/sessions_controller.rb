# Public: Handles user authentication sessions. Allows unauthenticated
# access to the login form and login action. Rate-limits login attempts
# to 10 per 3 minutes.
class SessionsController < ApplicationController
  allow_unauthenticated_access only: %i[ new create logout ]
  rate_limit to: 10,
    within: 3.minutes,
    only: :create,
    with: -> { redirect_to new_session_path, alert: "Try again later." }

  # Public: Renders the login form.
  def new
  end

  # Public: Authenticates a user with email and password. Starts a new
  # session and redirects to the post-authentication URL on success, or
  # redirects back to the login form with an alert on failure.
  def create
    if user = User.authenticate_by(params.permit(:email_address, :password))
      start_new_session_for user
      redirect_to after_authentication_url
    else
      redirect_to new_session_path, alert: "Try another email address or password."
    end
  end

  def logout
  end

  # Public: Terminates the current session and redirects to the login form.
  def destroy
    terminate_session
    redirect_to new_session_path, status: :see_other
  end
end
