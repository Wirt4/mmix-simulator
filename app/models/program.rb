# Public: An MMIX program belonging to a user.
#
# Each program has a title and a body containing the MMIX source code.
class Program < ApplicationRecord
  belongs_to :user
  has_one :executable
  validates :title, presence: true
  validates :body, presence: true
end
