require "test_helper"

class UsersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @admin = users(:admin)
    @admin_two = users(:admin_two)
    @user = users(:one)
  end
  # GET /users - admins should get a 200
  test "should allow admin to access index" do
    sign_in_as(@admin)
    get users_url
    assert_response :success
  end

  # GET /users - non-admin should get 403
  test "should not allow user to access index" do
    sign_in_as(@user)
    get users_url
    assert_response :forbidden
  end

  # GET /users — page lists all usernames and roles
  test "index: list all users with their roles" do
    sign_in_as(@admin)
    get users_url
    assert_response :success
    assert_select "td", text: @admin.user_name
    assert_select "td", text: @user.user_name
    assert_select "td", text: "user"
    assert_select "td", text: "admin"
  end

  # GET /users/:id/edit — admin gets 200
  test "edit: admin can GET edit for a user" do
    sign_in_as(@admin)
    get edit_user_url(@user)
    assert_response :success
  end

  # GET /users/:id/edit — form has a select for role with all enum keys as options
  test "edit: form has a role select tag populated from User.roles.keys" do
    sign_in_as(@admin)
    get edit_user_url(@user)
    assert_select "select[name=?]", "user[role]" do
      User.roles.keys.each do |role|
        assert_select "option[value=?]", role
      end
    end
  end

  # GET /users/:id/edit — form has a submit button
  test "edit: form has a submit button" do
    sign_in_as(@admin)
    get edit_user_url(@user)
    assert_select "input[type=submit], button[type=submit]"
  end

  # GET /users/:id/edit — submit button is inside the form element
  test "edit: Submit button is inside the form" do
    sign_in_as(@admin)
    get edit_user_url(@user)
    assert_select "form" do
      assert_select "button[type=submit]", text: "Submit"
    end
  end

# GET /users — Delete button in a POST form pointing to /users/:id (with hidden _method=delete)
test "index: Delete button for each user" do
  sign_in_as(@admin)
  get users_url
  assert_select "form[action=?][method=post]", user_path(@user) do
    assert_select "button[type=submit]", text: "Delete"
  end
end

  # PATCH /users/:id — admin updates role, redirects to /users
  test "update: admin can change a user's role" do
    sign_in_as(@admin)
    patch user_url(@user), params: { user: { role: "admin" } }
    assert_redirected_to users_url
    assert_equal "admin", @user.reload.role
  end


  # PATCH /users/:id — cannot demote last admin, redirects to /users with alert
  test "update: cannot demote the last remaining admin" do
    sign_in_as(@admin)
    @admin_two.destroy
    assert_equal 1, User.where(role: :admin).count

    patch user_url(@admin), params: { user: { role: "user" } }
    assert_redirected_to users_url
    assert_equal "admin", @admin.reload.role
    assert_equal "Cannot demote the last admin.", flash[:alert]
  end

  # PATCH /users/:id — non-admin gets 403, role unchanged
  test "update: non-admin cannot update roles" do
    sign_in_as(@user)
    patch user_url(@user), params: { user: { role: "admin" } }
    assert_response :forbidden
    assert_equal "user", @user.reload.role
  end

  # DELETE /users/:id — admin deletes non-admin, redirects to /users
  test "destroy: admin can delete a non-admin user" do
    sign_in_as(@admin)
    assert_difference("User.count", -1) do
      delete user_url(@user)
    end
    assert_redirected_to users_url
  end

  # DELETE /users/:id — admin cannot self-delete, redirects to /users with alert
  test "destroy: admin cannot delete themselves" do
    sign_in_as(@admin)
    assert_no_difference("User.count") do
      delete user_url(@admin)
    end
    assert_redirected_to users_url
    assert_equal "Cannot delete yourself.", flash[:alert]
  end

  # DELETE /users/:id — non-admin gets 403, no user deleted
  test "destroy: non-admin cannot delete users" do
    sign_in_as(@user)
    assert_no_difference("User.count") do
      delete user_url(@admin)
    end
    assert_response :forbidden
  end
end
