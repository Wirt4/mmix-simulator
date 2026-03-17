# Public: Handles admin edits to users views. Only allows admin-level users

class UsersController< ApplicationController
  def index
    head :ok
  end
end
