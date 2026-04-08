# Public: Represents the output produced by an MMIX simulation run.
#
# console_output - The String text content of the simulation output.
# trace_output   - The String trace output of the simulation run (optional).
# exit_value     - The Integer exit value of the simulation run.
# flags          - The String flags passed to the simulation run (optional).
class Output < ApplicationRecord
  belongs_to :mmixal_program

  validate :console_output_must_be_text
  validate :trace_output_must_be_text
  validate :flags_must_be_text
  validates :console_output, presence: true
  validates :exit_value, presence: true, numericality: { only_integer: true }

  private
  # Private: Validates that a given field's raw value is a String.
  #
  # field     - The Symbol attribute name to validate.
  # allow_nil - Boolean whether nil values are acceptable (default: true).
  #
  # Returns nothing.
  def validate_text_field(field, allow_nil: true)
    value = public_send(:"#{field}_before_type_cast")
    return if allow_nil && value.nil?
    errors.add(field, "must be text") unless value.is_a?(String)
  end

  # Private: Validates console_output is a non-nil String.
  def console_output_must_be_text = validate_text_field(:console_output, allow_nil: false)

  # Private: Validates trace_output is a String if present.
  def trace_output_must_be_text = validate_text_field(:trace_output)

  # Private: Validates flags is a String if present.
  def flags_must_be_text = validate_text_field(:flags)
end
