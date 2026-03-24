# Public: A compiled MMIX executable produced from a Program.
#
# body - The String compiled executable content.
class Executable < ApplicationRecord
  has_many :outputs

  validates :body, presence: true
end
