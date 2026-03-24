# Public: Represents the output produced by an MMIX simulation run.
#
# console_output - The String text content of the simulation output.
# exit_value     - The Integer exit value of the simulation run.
# executable     - The Executable that produced this output.
class Output < ApplicationRecord
  belongs_to :executable

  validates :console_output, presence: true
  validates :exit_value, presence: true, numericality: { only_integer: true }
end
