# Public: Handles admin edits to users views. Only allows admin-level users

class UsersController< ApplicationController
  def index
    return head :forbidden unless Current&.session&.user&.role == "admin"
    @users = User.all
  end
end
