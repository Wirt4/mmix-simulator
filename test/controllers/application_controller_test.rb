require "test_helper"

class ApplicationControllerTest < ActionDispatch::IntegrationTest
  test "unauthenticated request is redirected to sign in" do
    delete session_path

    assert_redirected_to new_session_path
  end

  test "authenticated request proceeds normally" do
    sign_in_as(users(:one))

    delete session_path

    assert_redirected_to new_session_path
  end

  test "authenticated? returns session when signed in" do
    user = users(:one)
    sign_in_as(user)

    get root_path

    assert_not_nil Current.session
  end

  test "authenticated? returns nil when not signed in" do
    get root_path

    assert_nil Current.session
  end
end
