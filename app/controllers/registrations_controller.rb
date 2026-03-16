# Public: Handles new user registration. Open to unauthenticated visitors.
# New users are always created with the default "user" role — the role
# param is never permitted.
class RegistrationsController < ApplicationController
  allow_unauthenticated_access
  rate_limit to: 10, within: 3.minutes, only: :create, with: -> { redirect_to new_registration_path, alert: "Try again later." }

  # Public: Renders the signup form.
  def new
    @user = User.new
  end

  # Public: Creates a new user account with the default "user" role.
  # On success, starts a session and redirects to root. On failure,
  # re-renders the signup form with validation errors.
  def create
    @user = User.new(registration_params)
    if @user.save
      start_new_session_for @user
      redirect_to root_path, notice: "Welcome! Your account has been created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

    def registration_params
      params.expect(user: [ :user_name, :email_address, :password, :password_confirmation ])
    end
end
