# Public: Thread-isolated attributes for the current request cycle.
#
# Provides per-request access to the authenticated session and its
# associated user. Inherits reset-on-request behavior from
# ActiveSupport::CurrentAttributes.
class Current < ActiveSupport::CurrentAttributes
  # Public: The Session for the current request.
  attribute :session

  # Public: The User associated with the current session.
  #
  # Returns the User, or nil when no session is set.
  delegate :user, to: :session, allow_nil: true
end
