require "test_helper"

class UsersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @admin = users(:admin)
    @user = users(:one)
  end

  test "should allow admin to access index" do
    sign_in_as(@admin)
    get users_url
    assert_response :success
  end

  test "should not allow user to access index" do
    sign_in_as(@user)
    get users_url
    assert_response :forbidden
  end

  test "index: list all users with their roles" do
    sign_in_as(@admin)
    get users_url
    assert_response :success
    assert_select "td", text: @admin.user_name
    assert_select "td", text: @user.user_name
    assert_select "td", text: "user"
    assert_select "td", text: "admin"
  end

  test "index: users have edit option" do
    sign_in_as(@admin)
    get users_url
    assert_response :success
    assert_select "button", text: "Edit", count: User.count
  end

  test "index: clicking edit redirects to edit page" do
    sign_in_as(@admin)
    get users_url
    assert_select "a[href=?]", edit_user_path(@user), text: "Edit"
  end
end
