# Public: A compiled MMIX executable produced from a Program.
#
# bin - The Binary compiled executable content.
class Executable < ApplicationRecord
  belongs_to :program
  has_many :outputs, dependent: :destroy

  validates :bin, presence: true
end
