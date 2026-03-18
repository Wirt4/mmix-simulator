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

  test "edit: admin can GET edit for a user" do
    sign_in_as(@admin)
    get edit_user_url(@user)
    assert_response :success
  end

  test "edit: form has a role select tag populated from User.roles.keys" do
    sign_in_as(@admin)
    get edit_user_url(@user)
    assert_select "select[name=?]", "user[role]" do
      User.roles.keys.each do |role|
        assert_select "option[value=?]", role
      end
    end
  end

  test "edit: form has a submit button" do
    sign_in_as(@admin)
    get edit_user_url(@user)
    assert_select "input[type=submit], button[type=submit]"
  end
=begin
  test "edit: has a back link to users index" do
    sign_in_as(@admin)
    get edit_user_url(@user)
    assert_select "a[href=?]", users_path
  end
=end
  test "update: admin can change a user's role" do
    sign_in_as(@admin)
    patch user_url(@user), params: { user: { role: "admin" } }
    assert_redirected_to users_url
    assert_equal "admin", @user.reload.role
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

  test "update: non-admin cannot update roles" do
    sign_in_as(@user)
    patch user_url(@user), params: { user: { role: "admin" } }
    assert_response :forbidden
    assert_equal "user", @user.reload.role
  end

  test "destroy: admin can delete a non-admin user" do
    sign_in_as(@admin)
    assert_difference("User.count", -1) do
      delete user_url(@user)
    end
    assert_redirected_to users_url
  end

  test "destroy: admin cannot delete themselves" do
    sign_in_as(@admin)
    assert_no_difference("User.count") do
      delete user_url(@admin)
    end
    assert_redirected_to users_url
    assert_equal "Cannot delete yourself.", flash[:alert]
  end

  test "destroy: non-admin cannot delete users" do
    sign_in_as(@user)
    assert_no_difference("User.count") do
      delete user_url(@admin)
    end
    assert_response :forbidden
  end
end
