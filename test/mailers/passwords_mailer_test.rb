require "test_helper"

# Public: Tests for PasswordsMailer.
class PasswordsMailerTest < ActionMailer::TestCase
  # Internal: Set up a test user from fixtures before each test.
  setup do
    @user = users(:one)
  end

  # Public: Verify that the reset email has the correct subject, recipient,
  # and sender.
  test "reset" do
    mail = PasswordsMailer.reset(@user)

    assert_equal "Reset your password", mail.subject
    assert_equal [ @user.email_address ], mail.to
    assert_equal [ "from@example.com" ], mail.from
  end
end
