require "test_helper"

# Public: Integration tests for SessionsController. Verifies login form
# rendering, authentication with valid and invalid credentials, and
# session destruction.
class SessionsControllerTest < ActionDispatch::IntegrationTest
  setup { @user = User.take }

  # Public: Verifies the login form renders successfully.
  test "new" do
    get new_session_path
    assert_response :success
  end

  # Public: Verifies the login form includes a link to the sign-up page.
  test "new includes sign up link" do
    get new_session_path
    assert_select "a[href=?]", new_registration_path, text: /sign up/i
  end

  # Public: Verifies that valid credentials start a session and redirect
  # to the root path.
  test "create with valid credentials" do
    post session_path, params: { email_address: @user.email_address, password: "password" }

    assert_redirected_to root_path
    assert cookies[:session_id]
  end

  # Public: Verifies that invalid credentials redirect back to the login
  # form without setting a session cookie.
  test "create with invalid credentials" do
    post session_path, params: { email_address: @user.email_address, password: "wrong" }

    assert_redirected_to new_session_path
    assert_nil cookies[:session_id]
  end

  # Regression: Verifies that the login endpoint enforces rate limiting after
  # 10 requests within 3 minutes, redirecting with an appropriate alert.
  test "create is rate limited after 10 requests" do
    11.times { post session_path, params: { email_address: @user.email_address, password: "wrong" } }

    assert_redirected_to new_session_path
    assert_equal "Try again later.", flash[:alert]
  end

   # Verifies the logout page renders successfully without authentication
   test "logout renders confirmation page" do
     get logout_path
     assert_response :success
   end

   # # Verifies that destroy requires authentication
   test "destroy requires authentication" do
     delete session_path
     assert_redirected_to new_session_path
   end

   # # Verifies that destroying a session clears the session cookie
   # # and redirects to the login form.
   test "destroy" do
     sign_in_as(@user)

     delete session_path

     assert_redirected_to new_session_path
     assert_empty cookies[:session_id]
   end
end
