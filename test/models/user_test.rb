require "test_helper"

# Public: Tests for the User model.
class UserTest < ActiveSupport::TestCase
  # Public: Verify that email normalization strips leading/trailing
  # whitespace and downcases the address.
  test "downcases and strips email_address" do
    user = User.new(email_address: " DOWNCASED@EXAMPLE.COM ")
    assert_equal("downcased@example.com", user.email_address)
  end
end
