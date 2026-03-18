require "test_helper"

class UsersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @admin = users(:admin)
    @admin_two = users(:admin_two)
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

  test "index: edit button issues GET to edit user path" do
    sign_in_as(@admin)
    get users_url
    assert_select "form[action=?][method=get]", edit_user_path(@user) do
      assert_select "button", text: "Edit"
    end
  end

  test "update: admin can change a user's role" do
    sign_in_as(@admin)
    patch user_url(@user), params: { user: { role: "admin" } }
    assert_redirected_to users_url
    assert_equal "admin", @user.reload.role
  end

  test "update: only permits role param" do
    sign_in_as(@admin)
    original_name = @user.user_name
    patch user_url(@user), params: { user: { role: "admin", user_name: "hacked" } }
    @user.reload
    assert_equal "admin", @user.role
    assert_equal original_name, @user.user_name
  end

  test "update: cannot demote the last remaining admin" do
    sign_in_as(@admin)
    @admin_two.destroy
    assert_equal 1, User.where(role: :admin).count

    patch user_url(@admin), params: { user: { role: "user" } }
    assert_redirected_to users_url
    assert_equal "admin", @admin.reload.role
    assert_equal "Cannot demote the last admin.", flash[:alert]
  end

  test "update: can demote an admin when another admin exists" do
    sign_in_as(@admin)
    assert User.where(role: :admin).count >= 2

    patch user_url(@admin_two), params: { user: { role: "user" } }
    assert_redirected_to users_url
    assert_equal "user", @admin_two.reload.role
  end

  test "update: non-admin cannot update roles" do
    sign_in_as(@user)
    patch user_url(@user), params: { user: { role: "admin" } }
    assert_response :forbidden
    assert_equal "user", @user.reload.role
  end
end
