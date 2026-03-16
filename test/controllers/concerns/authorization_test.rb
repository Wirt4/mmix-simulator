require "test_helper"

# Public: Tests for the Authorization concern. Uses UsersController (admin-only)
# as a real-world fixture for the require_role before_action.
class AuthorizationTest < ActionDispatch::IntegrationTest
  setup do
    @admin = users(:admin)
    @user  = users(:one)
  end

  # Public: Verify require_role blocks a user without the required role.
  test "require_role blocks unauthorized role" do
    sign_in_as @user
    get users_path
    assert_redirected_to root_path
    assert_equal "Not authorized.", flash[:alert]
  end

  # Public: Verify require_role allows a user with the required role.
  test "require_role allows authorized role" do
    sign_in_as @admin
    get users_path
    assert_response :success
  end
end
