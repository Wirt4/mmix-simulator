# Public: A compiled MMIX executable produced from a Program.
#
# body - The String compiled executable content.
class Executable < ApplicationRecord
  belongs_to :program
  has_many :outputs, dependent: :destroy

  validates :body, presence: true
end
