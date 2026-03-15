# Public: Mailer for sending password-related emails to users.
class PasswordsMailer < ApplicationMailer
  # Public: Send a password reset email to the given user.
  #
  # user - The User who requested a password reset.
  #
  # Returns a Mail::Message.
  def reset(user)
    @user = user
    mail subject: "Reset your password", to: user.email_address
  end
end
