# Public: An MMIX program belonging to a user.
#
# title - The String title of the program.
# body  - The String MMIX source code.
class Program < ApplicationRecord
  belongs_to :user
  has_many :executables, dependent: :destroy
  validates :title, presence: true
  validates :body, presence: true
end
