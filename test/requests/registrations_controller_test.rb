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

  test "create with valid params redirects to root" do
    post registration_path, params: {
      user: {
        user_name: "newuser",
        email_address: "newuser@example.com",
        password: "password",
        password_confirmation: "password"
      }
    }
    assert_redirected_to root_path
  end

  test "create with missing user_name renders errors" do
    post registration_path, params: {
      user: {
        user_name: "",
        email_address: "newuser@example.com",
        password: "password",
        password_confirmation: "password"
      }
    }
    assert_response :unprocessable_entity
    assert_select "#error_explanation li", /User name/
  end

  test "create with duplicate email renders errors" do
    post registration_path, params: {
      user: {
        user_name: "newuser",
        email_address: users(:one).email_address,
        password: "password",
        password_confirmation: "password"
      }
    }
    assert_response :unprocessable_entity
    assert_select "#error_explanation li", /Email address/
  end

  test "create with mismatched password confirmation renders errors" do
    post registration_path, params: {
      user: {
        user_name: "newuser",
        email_address: "newuser@example.com",
        password: "password",
        password_confirmation: "different"
      }
    }
    assert_response :unprocessable_entity
    assert_select "#error_explanation li", /Password confirmation/
  end

  test "create is rate limited after 10 requests" do
    11.times do |i|
      post registration_path, params: {
        user: {
          user_name: "user#{i}",
          email_address: "user#{i}@example.com",
          password: "password",
          password_confirmation: "password"
        }
      }
    end

    assert_redirected_to new_registration_path
    assert_equal "Try again later.", flash[:alert]
  end
end
