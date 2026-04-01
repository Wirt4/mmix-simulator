# Public: Handles new user registration. Allows unauthenticated access to
# the registration form and creation action. Rate-limits registration
# attempts to 10 per 3 minutes.
class RegistrationsController < ApplicationController
  allow_unauthenticated_access only: %i[ new create ]

  rate_limit to: 10,
    within: 3.minutes,
    only: :create,
    with: -> { redirect_to new_registration_path, alert: "Try again later." }

  # Public: Renders the registration form.
  def new
  end

  # Public: Creates a new user account from the submitted registration
  # params. Starts a session and redirects to root on success, or
  # re-renders the form with errors on failure.
  def create
    @user = User.new(registration_params)
    if @user.save
      start_new_session_for @user
      return redirect_to root_path
    end

    render :new, status: :unprocessable_entity
  end

  private

  # Private: Permits registration form parameters.
  #
  # Returns an ActionController::Parameters with :user_name,
  #   :email_address, :password, and :password_confirmation.
  def registration_params
    params.require(:user).permit(:user_name, :email_address, :password, :password_confirmation)
  end
end
