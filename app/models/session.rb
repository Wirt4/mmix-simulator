# Public: Represents an authenticated session for a user.
#
# A Session ties a login event to a specific User, tracking
# active authentication state.
class Session < ApplicationRecord
  # Internal: The User who owns this session.
  belongs_to :user
end
