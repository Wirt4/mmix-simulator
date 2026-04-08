# Public: An MMIX program belonging to a user.
#
# title  - The String title of the program.
# source - The String MMIX source code.

# TODO: change name to MMIXALProgram
#  - update db accordingly
class MMIXALProgram < ApplicationRecord
  belongs_to :user
  has_one :output, dependent: :destroy
  validates :title, presence: true
  validates :source, presence: true
end
