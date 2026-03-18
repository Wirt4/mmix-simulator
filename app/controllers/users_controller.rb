# Public: Handles admin edits to users views. Only allows admin-level users

class UsersController< ApplicationController
  def index
    return head :forbidden unless Current&.session&.user&.role == "admin"
    @users = User.all
  end

  def update
    @user = User.find(params[:id])
    @user.update(role: params.dig(:user, :role))
    redirect_to users_url
  end
end
