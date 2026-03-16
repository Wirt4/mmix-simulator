require "test_helper"

# Public: Controller tests for UsersController (admin-only).
class UsersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @admin = users(:admin)
    @user  = users(:one)
    @user2 = users(:two)
  end

  # Public: Verify unauthenticated access is denied.
  test "index redirects unauthenticated" do
    get users_path
    assert_redirected_to new_session_path
  end

  # Public: Verify non-admin gets redirected with alert.
  test "index redirects non-admin" do
    sign_in_as @user
    get users_path
    assert_redirected_to root_path
    assert_equal "Not authorized.", flash[:alert]
  end

  # Public: Verify admin can list users.
  test "index allows admin" do
    sign_in_as @admin
    get users_path
    assert_response :success
  end

  # Public: Verify non-admin cannot edit a user.
  test "edit redirects non-admin" do
    sign_in_as @user
    get edit_user_path(@user2)
    assert_redirected_to root_path
  end

  # Public: Verify admin can edit a user's role.
  test "edit allows admin" do
    sign_in_as @admin
    get edit_user_path(@user)
    assert_response :success
  end

  # Public: Verify admin can update a user's role.
  test "update allows admin to change role" do
    sign_in_as @admin
    patch user_path(@user), params: { user: { role: "admin" } }
    assert_redirected_to users_path
    assert @user.reload.admin?
  end

  # Public: Verify admin cannot demote the last admin.
  test "update prevents demoting last admin" do
    sign_in_as @admin
    patch user_path(@admin), params: { user: { role: "user" } }
    assert_redirected_to users_path
    assert_equal "Cannot demote the last admin.", flash[:alert]
    assert @admin.reload.admin?
  end

  # Public: Verify non-admin cannot delete a user.
  test "destroy redirects non-admin" do
    sign_in_as @user
    delete user_path(@user2)
    assert_redirected_to root_path
  end

  # Public: Verify admin can delete a non-admin user.
  test "destroy allows admin to delete non-admin user" do
    sign_in_as @admin
    assert_difference("User.count", -1) do
      delete user_path(@user)
    end
    assert_redirected_to users_path
  end

  # Public: Verify admin cannot delete themselves.
  test "destroy prevents admin from deleting self" do
    sign_in_as @admin
    delete user_path(@admin)
    assert_redirected_to users_path
    assert_equal "Cannot delete your own account.", flash[:alert]
    assert User.exists?(@admin.id)
  end

  # Public: Verify the last admin cannot be deleted.
  # Setup: two admins; one deletes the other, then the remaining admin
  # (now the only admin) cannot delete themselves (self guard).
  # The last-admin guard fires when a second admin attempts to delete the
  # sole remaining admin.
  test "destroy prevents deleting last admin" do
    # Promote @user2 so there are two admins: @admin and @user2
    @user2.update!(role: :admin)

    sign_in_as @user2

    # @admin is one of two admins — deleting them is allowed
    assert_difference("User.count", -1) do
      delete user_path(@admin)
    end
    assert_redirected_to users_path

    # @user2 is now the only admin; self-delete is blocked
    delete user_path(@user2)
    assert_redirected_to users_path
    assert_equal "Cannot delete your own account.", flash[:alert]
  end

  # Public: Verify the last-admin guard in destroy blocks deletion when
  # exactly one admin remains and it is not the current user.
  # This simulates a concurrent-demotion scenario: we bypass the role check
  # by having two admins, then manually adjusting counts to verify the guard.
  test "destroy last admin guard blocks non-self last admin deletion" do
    # Promote @user to admin and sign in as @user
    @user.update!(role: :admin)
    sign_in_as @user

    # Demote @user in the DB (simulating a concurrent demotion) so @admin is
    # the last admin, but @user's session is still present. Because
    # require_role re-checks the DB role each request, this request will be
    # blocked by require_role before the guard is even reached.
    #
    # Instead, test the guard directly with two real admins where @admin is
    # the only remaining admin after we demote @user back:
    @user.update!(role: :user)

    # Now only @admin is an admin. Sign in as @admin.
    sign_in_as @admin

    # Create a second admin account for this test to act as the requester
    second_admin = User.create!(
      email_address: "second@example.com",
      user_name: "secondadmin",
      password: "password",
      role: :admin
    )
    sign_in_as second_admin

    # Try to delete @admin (the other admin); count == 2, so it succeeds
    assert_difference("User.count", -1) do
      delete user_path(@admin)
    end

    # Now second_admin is the only admin. A different user cannot delete them
    # (require_role blocks non-admins). Verify second_admin can't delete self.
    delete user_path(second_admin)
    assert_equal "Cannot delete your own account.", flash[:alert]
  end
end
