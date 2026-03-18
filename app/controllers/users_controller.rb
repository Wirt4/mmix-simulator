# Public: Handles admin edits to users views. Only allows admin-level users

class UsersController< ApplicationController
  def index
    return head :forbidden unless Current&.session&.user&.role == "admin"
    @users = User.all
  end

  def update
    @user = User.find(params[:id])
    new_role = params.dig(:user, :role)
    if new_role != "admin" && @user.role == "admin" && User.where(role: :admin).count == 1
      flash[:alert] = "Cannot demote the last admin."
      return redirect_to users_url
    end
    @user.update(role: new_role)
    redirect_to users_url
  end
end
