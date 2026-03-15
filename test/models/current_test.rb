require "test_helper"

# Public: Unit tests for the Current request-scoped attributes model.
class CurrentTest < ActiveSupport::TestCase
  # Public: Verify that .user delegates to the session's user.
  test "delegates user to session" do
    Current.session = sessions(:one)

    assert_equal users(:one), Current.user
  end

  # Public: Verify that .user returns nil when no session is set.
  test "returns nil when session is nil" do
    Current.session = nil

    assert_nil Current.user
  end
end
