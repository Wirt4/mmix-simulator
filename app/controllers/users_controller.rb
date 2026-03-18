# Public: Handles admin edits to users views. Only allows admin-level users

class UsersController< ApplicationController
  # Public: only the admin may view the users information
  def index
    return head :forbidden unless current_is_admin?
    @users = User.all
  end

  # Public: updates the role of a given user
  def update
    return head :forbidden unless current_is_admin?

    @user = User.find(params[:id])
    new_role = params.dig(:user, :role)

    if is_removing_last_admin?(@user, new_role)
      flash[:alert] = "Cannot demote the last admin."
      return redirect_to users_url
    end

    @user.update(role: new_role)
    redirect_to users_url
  end

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

  def current_is_admin?
    !!(Current&.session&.user&.role == "admin")
  end

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
