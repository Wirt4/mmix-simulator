# Handles WebSocket connection authentication for Action Cable.
#
# Authenticates incoming connections by looking up a session from a
# signed cookie. Rejects any connection that does not have a valid
# session.
module ApplicationCable
  # Public: Establishes the identity of the connected user.
  #
  # Looks up the session by the signed session_id cookie. If a matching
  # session is found, sets current_user to the session's owner.
  # Otherwise, rejects the connection.
  class Connection < ActionCable::Connection::Base
    identified_by :current_user
    # Public: Authenticates the incoming WebSocket connection.
    #
    # Reads the signed session_id cookie, finds the corresponding Session
    # record, and assigns its user as the current_user. Rejects the
    # connection if no matching session exists.
    #
    # Returns nothing.
    # Raises ActionCable::Connection::Authorization if session is invalid.
    def connect
      session = Session.find_by(id: cookies.signed[:session_id])
      if session
        self.current_user = session.user
      else
        reject_unauthorized_connection
      end
    end
  end
end
