# Public: Represents the output produced by an MMIX simulation run.
#
# console_output - The String text content of the simulation output.
# trace_output   - The String trace output of the simulation run (optional).
# exit_value     - The Integer exit value of the simulation run.
# executable     - The Executable that produced this output.
class Output < ApplicationRecord
  belongs_to :executable

  validate :console_output_must_be_text
  validate :trace_output_must_be_text
  validates :console_output, presence: true
  validates :exit_value, presence: true, numericality: { only_integer: true }

  private

  def console_output_must_be_text
    unless console_output_before_type_cast.is_a?(String)
      errors.add(:console_output, "must be text")
    end
  end

  def trace_output_must_be_text
    return if trace_output_before_type_cast.nil?

    unless trace_output_before_type_cast.is_a?(String)
      errors.add(:trace_output, "must be text")
    end
  end
end
