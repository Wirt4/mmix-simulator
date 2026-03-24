# Public: Represents the output produced by an MMIX simulation run.
#
# body - The String text content of the simulation output.
class Output < ApplicationRecord
  belongs_to :executable

  validates :body, presence: true
end
