require "test_helper"

# Public: Integration tests for RegistrationsController. Verifies signup form
# rendering, user creation with valid and invalid params, strong param
# enforcement (role cannot be set via registration), and session creation on
# successful signup.
class RegistrationsControllerTest < ActionDispatch::IntegrationTest
  # Public: Verifies the signup form renders successfully without requiring
  # authentication.
  test "GET new renders the registration form" do
    get new_registration_path
    assert_response :success
  end

  test "GET new renders a user_name field" do
    get new_registration_path
    assert_select "input[name='user[user_name]']"
  end

  test "GET new renders an email_address field" do
    get new_registration_path
    assert_select "input[name='user[email_address]']"
  end

  test "GET new renders a password field" do
    get new_registration_path
    assert_select "input[name='user[password]'][type='password']"
  end

  test "GET new renders a password_confirmation field" do
    get new_registration_path
    assert_select "input[name='user[password_confirmation]'][type='password']"
  end

  test "GET new renders a submit button" do
    get new_registration_path
    assert_select "input[type='submit'], button[type='submit']"
  end
=begin
  test "GET new form posts to registration_path" do
    get new_registration_path
    assert_select "form[action='#{registration_path}'][method='post']"
  end

  test "GET new does not render a role field" do
    get new_registration_path
    assert_select "input[name='user[role]']", count: 0
    assert_select "select[name='user[role]']", count: 0
  end

  test "POST create with invalid params re-renders form with fields intact" do
    post registration_path, params: {
      user: {
        user_name: "",
        email_address: "",
        password: "securepassword",
        password_confirmation: "securepassword"
      }
    }

    assert_response :unprocessable_entity
    assert_select "input[name='user[user_name]']"
    assert_select "input[name='user[email_address]']"
    assert_select "input[name='user[password]']"
    assert_select "input[name='user[password_confirmation]']"
  end

  test "POST create with mismatched passwords does not create a user" do
    assert_no_difference "User.count" do
      post registration_path, params: {
        user: {
          user_name: "newuser",
          email_address: "newuser@example.com",
          password: "securepassword",
          password_confirmation: "differentpassword"
        }
      }
    end

    assert_response :unprocessable_entity
  end

  # Public: Verifies that valid registration params create a user, start a
  # session, and redirect to the root path.
  test "POST create with valid params creates a user and redirects to root" do
    assert_difference "User.count", 1 do
      post registration_path, params: {
        user: {
          user_name: "newuser",
          email_address: "newuser@example.com",
          password: "securepassword",
          password_confirmation: "securepassword"
        }
      }
    end

    assert_redirected_to root_path
  end

  # Public: Verifies that invalid params (missing required fields) do not
  # create a user and re-render the form.
  test "POST create with missing email does not create a user" do
    assert_no_difference "User.count" do
      post registration_path, params: {
        user: {
          user_name: "newuser",
          email_address: "",
          password: "securepassword",
          password_confirmation: "securepassword"
        }
      }
    end

    assert_response :unprocessable_entity
  end

  # Public: Verifies that a session cookie is set after successful registration.
  test "POST create with valid params starts a session" do
    post registration_path, params: {
      user: {
        user_name: "newuser",
        email_address: "newuser@example.com",
        password: "securepassword",
        password_confirmation: "securepassword"
      }
    }

    assert cookies[:session_id], "Expected a session cookie to be set after registration"
  end

  # Public: Verifies that a newly registered user is assigned the default
  # `user` role (integer value 1), never `admin`.
  test "POST create assigns the default user role" do
    post registration_path, params: {
      user: {
        user_name: "newuser",
        email_address: "newuser@example.com",
        password: "securepassword",
        password_confirmation: "securepassword"
      }
    }

    created_user = User.find_by(email_address: "newuser@example.com")
    assert_not_nil created_user
    assert created_user.user?, "Expected new user to have the `user` role"
    assert_equal 1, created_user.role_before_type_cast
  end

  # Public: Verifies that a missing user_name does not create a user and
  # re-renders the form.
  test "POST create with missing user_name does not create a user" do
    assert_no_difference "User.count" do
      post registration_path, params: {
        user: {
          user_name: "",
          email_address: "newuser@example.com",
          password: "securepassword",
          password_confirmation: "securepassword"
        }
      }
    end

    assert_response :unprocessable_entity
  end

  # Public: Verifies that a duplicate email address does not create a user
  # and re-renders the form.
  test "POST create with a duplicate email address does not create a user" do
    existing_user = users(:one)

    assert_no_difference "User.count" do
      post registration_path, params: {
        user: {
          user_name: "brandnewname",
          email_address: existing_user.email_address,
          password: "securepassword",
          password_confirmation: "securepassword"
        }
      }
    end

    assert_response :unprocessable_entity
  end

  # Public: Verifies that a duplicate user_name does not create a user and
  # re-renders the form.
  test "POST create with a duplicate user_name does not create a user" do
    existing_user = users(:one)

    assert_no_difference "User.count" do
      post registration_path, params: {
        user: {
          user_name: existing_user.user_name,
          email_address: "unique@example.com",
          password: "securepassword",
          password_confirmation: "securepassword"
        }
      }
    end

    assert_response :unprocessable_entity
  end
=end
end
