# Public: Handles password reset flow. Allows unauthenticated access to
# all actions. Rate-limits reset requests to 10 per 3 minutes.
class PasswordsController < ApplicationController
  allow_unauthenticated_access
  before_action :set_user_by_token, only: %i[ edit update ]
  rate_limit to: 10, within: 3.minutes, only: :create, with: -> { redirect_to new_password_path, alert: "Try again later." }

  # Public: Renders the password reset request form.
  def new
  end

  # Public: Sends password reset instructions to the given email address.
  # Always redirects to the login page with a generic notice regardless of
  # whether the email exists, to avoid leaking user information.
  def create
    if user = User.find_by(email_address: params[:email_address])
      PasswordsMailer.reset(user).deliver_later
    end

    redirect_to new_session_path, notice: "Password reset instructions sent (if user with that email address exists)."
  end

  # Public: Renders the password reset form for a valid reset token.
  def edit
  end

  # Public: Updates the user's password. Destroys all existing sessions on
  # success and redirects to the login page. Redirects back to the reset
  # form if the passwords do not match.
  def update
    if @user.update(params.permit(:password, :password_confirmation))
      @user.sessions.destroy_all
      redirect_to new_session_path, notice: "Password has been reset."
    else
      redirect_to edit_password_path(params[:token]), alert: "Passwords did not match."
    end
  end

  private
    # Internal: Looks up the user by password reset token. Redirects to the
    # reset request form if the token is invalid or expired.
    def set_user_by_token
      @user = User.find_by_password_reset_token!(params[:token])
    rescue ActiveSupport::MessageVerifier::InvalidSignature
      redirect_to new_password_path, alert: "Password reset link is invalid or has expired."
    end
end
