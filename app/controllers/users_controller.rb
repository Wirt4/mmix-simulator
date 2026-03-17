# Public: Handles admin edits to users views. Only allows admin-level users

class UsersController< ApplicationController
  def index
    # the head is forbidden (403) unless the current session's user is an admin
    return head :forbidden unless Current&.session&.user&.role == "admin"
    head :ok
  end
end
