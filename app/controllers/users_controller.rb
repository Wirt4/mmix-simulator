# Public: Handles admin edits to users views. Only allows admin-level users

class UsersController< ApplicationController
  def index
    return head :forbidden unless Current&.session&.user&.role == "admin"
    @users = User.all
  end

  def update
    return head :forbidden unless Current&.session&.user&.role == "admin"

    @user = User.find(params[:id])
    new_role = params.dig(:user, :role)
    if is_deleting_last_admin?(@user, new_role)
      flash[:alert] = "Cannot demote the last admin."
      return redirect_to users_url
    end
    @user.update(role: new_role)
    redirect_to users_url
  end

  private
  def is_deleting_last_admin?(user, new_role)
    !!(is_admin?(user, new_role) && one_admin_left?)
  end
  def is_admin?(user, role)
    admin = "admin"
    !!(user.role == admin && role != admin)
  end
  def one_admin_left?
    User.where(role: :admin).count == 1
  end
end
