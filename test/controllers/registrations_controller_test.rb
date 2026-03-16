require "test_helper"

# Public: Controller tests for RegistrationsController.
class RegistrationsControllerTest < ActionDispatch::IntegrationTest
  # Public: Verify the signup form renders successfully.
  test "new renders signup form" do
    get new_registration_path
    assert_response :success
  end

  # Public: Verify valid params create a user, set a session, and redirect to root.
  test "create with valid params creates user and starts session" do
    assert_difference("User.count", 1) do
      post registration_path, params: {
        user: {
          user_name: "newuser",
          email_address: "new@example.com",
          password: "password",
          password_confirmation: "password"
        }
      }
    end

    assert_redirected_to root_path
    assert cookies[:session_id]
  end

  # Public: Verify invalid params re-render the form without creating a user.
  test "create with invalid params re-renders form" do
    assert_no_difference("User.count") do
      post registration_path, params: {
        user: {
          user_name: "",
          email_address: "bad",
          password: "password",
          password_confirmation: "wrong"
        }
      }
    end

    assert_response :unprocessable_entity
  end

  # Public: Verify the role param cannot be set via registration.
  test "create does not allow setting role" do
    post registration_path, params: {
      user: {
        user_name: "attacker",
        email_address: "attacker@example.com",
        password: "password",
        password_confirmation: "password",
        role: "admin"
      }
    }

    new_user = User.find_by(email_address: "attacker@example.com")
    assert new_user.user?
    assert_not new_user.admin?
  end

  # Public: Verify new users default to the user role.
  test "new user defaults to user role" do
    post registration_path, params: {
      user: {
        user_name: "defaultrole",
        email_address: "default@example.com",
        password: "password",
        password_confirmation: "password"
      }
    }

    new_user = User.find_by(email_address: "default@example.com")
    assert new_user.user?
  end
end
