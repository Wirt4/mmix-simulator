require "test_helper"
# Tests for the ApplicationCable WebSocket connection authentication.
#
# Verifies that connections are accepted or rejected based on the
# presence and validity of a signed session cookie.
class ApplicationCable::ConnectionTest < ActionCable::Connection::TestCase
  # Verifies that a connection attempt with no session cookie is rejected.
  #
  # Returns nothing.
  test "rejects connection without session cookie" do
    assert_reject_connection { connect }
  end
  # Verifies that a connection attempt with a tampered or nonexistent
  # session ID is rejected.
  #
  # Returns nothing.
  test "rejects connection with invalid session id" do
    cookies.signed[:session_id] = "invalid"
    assert_reject_connection { connect }
  end
  # Verifies that a connection attempt with a valid signed session cookie
  # succeeds and that the connection's current_user matches the session owner.
  #
  # Returns nothing.
  test "connects with valid session cookie" do
    user = users(:one)
    session = user.sessions.create!

    cookies.signed[:session_id] = session.id
    connect

    assert_equal user, connection.current_user
  end
end
