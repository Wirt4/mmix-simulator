# Public: Handles admin edits to users views. Only allows admin-level users

class UsersController< ApplicationController
  require_role :admin

  # Public: only the admin may view the users information
  def index
    @users = User.all
  end

  # Public: Loads the user and renders the edit form.
  def edit
    @user = User.find(params[:id])
  end

  # Public: updates the role of a given user
  def update
    edit
    new_role = params.require(:user).permit(:role)[:role]

    if is_removing_last_admin?(@user, new_role)
      flash[:alert] = "Cannot demote the last admin."
    else
      @user.update(role: new_role)
    end

    redirect_to users_url
  end

  # Public: deletes selected user. Editing users may not delete themselves
  def destroy
    @user = User.find(params[:id])
    if @user == Current.session.user
      flash[:alert] = "Cannot delete yourself."
    else
      @user.destroy
    end
    redirect_to users_url
  end

  private

  # Private: Checks whether the role change would remove the last admin.
  #
  # user     - The User being updated.
  # new_role - The String role to assign.
  #
  # Returns true if the user is the last admin and would be demoted.
  def is_removing_last_admin?(user, new_role)
    !!(role_is_admin?(user, new_role) && one_admin_left?)
  end

  # Private: Checks whether a user currently has the admin role and is
  # being changed to a non-admin role.
  #
  # user - The User to check.
  # role - The String new role.
  #
  # Returns true if the user is an admin being demoted.
  def role_is_admin?(user, role)
    admin = "admin"
    !!(user.role == admin && role != admin)
  end

  # Private: Checks if only one admin remains.
  #
  # Returns true if there is exactly one admin User.
  def one_admin_left?
    User.where(role: :admin).count == 1
  end
end
