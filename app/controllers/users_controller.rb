# Public: Handles admin edits to users views. Only allows admin-level users

class UsersController< ApplicationController
  require_role :admin

  # Public: only the admin may view the users information
  def index
    @users = User.all
  end

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

  def is_removing_last_admin?(user, new_role)
    !!(role_is_admin?(user, new_role) && one_admin_left?)
  end

  def role_is_admin?(user, role)
    admin = "admin"
    !!(user.role == admin && role != admin)
  end

  def one_admin_left?
    User.where(role: :admin).count == 1
  end
end
