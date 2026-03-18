require "test_helper"
# Integration tests for the Authentication concern.
#
# Covers the full authentication lifecycle including login, logout,
# session management, cookie handling, and redirect behavior for
# protected routes.
class AuthenticationIntegrationTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
  end

   # Verifies that after being redirected to login, a successful
   # authentication sends the user back to the URL they originally requested.
   #
   # Tests: request_authentication stores return URL,
   #        after_authentication_url returns it
   test "after login redirects back to originally requested URL" do
     delete session_url
     assert_redirected_to new_session_path

     post session_url, params: { email_address: @user.email_address, password: "password" }
     assert_redirected_to session_url
   end

   # Verifies that an authenticated user with a valid session cookie
   # can access a protected route and receives the expected response.
   #
   # Tests: resume_session / find_session_by_cookie
   test "authenticated user can access protected route via session cookie" do
     sign_in_as @user
     delete session_url
     assert_redirected_to new_session_path
     assert_response :see_other
   end

  # Verifies that a successful login creates a Session record in the
  # database and sets a session cookie on the response.
  #
  # Tests: start_new_session_for creates session record and sets cookie
  test "successful login creates session and sets cookie" do
    assert_difference "Session.count", 1 do
      post session_url, params: { email_address: @user.email_address, password: "password" }
    end

    assert_not_nil cookies[:session_id]
  end

  # Verifies that logging in without a prior protected request redirects
  # the user to the application root rather than a stored return URL.
  #
  # Tests: after_authentication_url defaults to root when no stored return URL
  test "login without prior protected request redirects to root" do
    post session_url, params: { email_address: @user.email_address, password: "password" }
    assert_redirected_to root_url
  end

  # Verifies that logging out destroys the Session record in the database
  # and clears the session cookie.
  #
  # Tests: terminate_session destroys session record and clears cookie
  # test "logout destroys session record" do
  #   sign_in_as @user
  #   session_record = Current.session
  #
  #   delete session_url
  #   assert_nil Session.find_by(id: session_record.id)
  # end

  # Verifies the full authentication lifecycle: login redirects to root,
  # logout redirects to login, and subsequent requests remain
  # unauthenticated.
  #
  # Tests: full flow — login, access protected route, logout, redirect
  # test "full authentication lifecycle" do
  #   # login
  #   post session_url, params: { email_address: @user.email_address, password: "password" }
  #   assert_redirected_to root_url
  #
  #   # logout (protected route, should work while authenticated)
  #   delete session_url
  #   assert_redirected_to new_session_path
  #
  #   # now unauthenticated again
  #   delete session_url
  #   assert_redirected_to new_session_path
  # end

  # Verifies that a login attempt with incorrect credentials does not
  # create a Session record in the database.
  test "failed login does not create a session" do
    assert_no_difference "Session.count" do
      post session_url, params: { email_address: @user.email_address, password: "wrong" }
    end
  end
end
