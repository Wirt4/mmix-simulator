# Public: Admin-only controller for managing user accounts.
# All actions require the :admin role. Guards prevent admins from
# deleting themselves or removing the last admin account.
class UsersController < ApplicationController
  require_role :admin

  # Public: Lists all users with their roles.
  def index
    @users = User.all.order(:user_name)
  end

  # Public: Renders the role-editing form for a user.
  def edit
    @user = User.find(params[:id])
  end

  # Public: Updates a user's role. Prevents demoting the last admin.
  def update
    @user = User.find(params[:id])

    if demoting_last_admin?(@user, params.dig(:user, :role))
      redirect_to users_path, alert: "Cannot demote the last admin."
      return
    end

    if @user.update(role_param)
      redirect_to users_path, notice: "User updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  # Public: Deletes a user. Prevents an admin from deleting themselves
  # or deleting the last admin account.
  def destroy
    @user = User.find(params[:id])

    if @user == Current.user
      redirect_to users_path, alert: "Cannot delete your own account."
      return
    end

    if @user.admin? && User.where(role: :admin).count == 1
      redirect_to users_path, alert: "Cannot delete the last admin."
      return
    end

    @user.destroy!
    redirect_to users_path, notice: "User deleted."
  end

  private

    def role_param
      params.expect(user: [ :role ])
    end

    # Internal: Returns true if the update would remove the last admin.
    def demoting_last_admin?(user, new_role)
      return false unless user.admin?
      return false if new_role.to_s == "admin"
      User.where(role: :admin).count == 1
    end
end
