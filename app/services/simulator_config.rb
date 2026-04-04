# maps human-readable options to command-line flags for the mmix simulator
# interactive mode not available
# see full docs at https://mmix.cs.hm.edu/doc/mmix-sim.pdf
class SimulatorConfig
  MAX_FILE_NAME_SIZE = 256
  FILE_NAME_PATTERN = /^(?!.*(?:^|\/)\.{1,2}(?:\/|$))[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*(?:\.[A-Za-z0-9_-]+)?$/

  def initialize
    @trace_n_times = nil
    @trace_arithmetic_exceptions = nil
    @trace_register_stack = false
    @list_source_lines = nil
    @show_running_time_statistics = false
    @show_program_profile = false
    @list_profile_source_lines = nil
    @verbose = false
    @quiet = false
    @buffer_size = nil
    @register_ring_capacity = nil
    @in_file = nil
    @out_file = nil
  end

  # positive integer
  # Trace each instruction the first n times it is executed.
  def trace_n_times=(new_value)
    verify_integer(new_value)
    verify_non_negative(new_value, "trace_n_times")
    @trace_n_times = parse_boolean_or_number(new_value)
  end

  # boolean or integer between 0 (0x00) and 255 (0xFF)
  # Trace all arithmetic exceptions. Accepts an two byte bitmask or boolean.
  # For convenience's sake, the bitmask is represented in hexidecimal form, ie: 0x0D or 0xFF
  #
  # The exception bits are DVWIOUZX
  # 0x80: D (Integer Divide Check)
  # 0x40: V (Integer Overflow)
  # 0x20: W (Floating Inexact) - Note: W is used for Floating Inexact, while X is the other
  # 0x10: I (Floating Invalid Operation)
  # 0x08: O (Floating Overflow)
  # 0x04: U (Floating Underflow)
  # 0x02: Z (Floating Divide Zero)
  # 0x01: X (Floating Inexact) - N
  #
  # Alternatively Pass `true` to set all.
  def trace_arithmetic_exceptions=(new_value)
    verify_integer_or_boolean(new_value)
    if new_value.is_a?(Integer) && (new_value < 0 || new_value > 0xFF)
      raise ArgumentError, "bitmask must be hexidecmal value between 0x00 and 0xFF"
    end
    @trace_arithmetic_exceptions = new_value
  end

  # boolean
  # Set true to trace register stack
  # The option shows all the "hidden" loads and stores that occur.
  # It also shows the full details of SAVE and UNSAVE operations.
  def trace_register_stack=(new_value)
    @trace_register_stack = verify_boolean(new_value)
  end

  # boolean or integer
  # list the source line corresponding to each traced instruction(such as in trace_n_times), filling gaps of length n or less, if is set to true (flag -l), then n defaults to 3
  def list_source_lines=(new_value)
    @list_source_lines = parse_source_lines("list_source_lines", new_value)
  end

  # boolean
  # shows statistics of running time with each traced instruction.
  def show_running_time_statistics=(new_value)
    @show_running_time_statistics = verify_boolean(new_value)
  end

  # boolean
  # Show the frequency counts of each instruction that was executed when the simulation ends
  def show_program_profile=(new_value)
    @show_program_profile = verify_boolean(new_value)
  end

  # boolean or Integer
  # lists the source lines corresponding to each instruction that appears in the program profile, filling gaps of length n or less(defaults to 3).
  # This option implies @show_program_profile
  def list_profile_source_lines=(new_value)
    @list_profile_source_lines = parse_source_lines("list_profile_source_lines", new_value)
  end

  # boolean
  # turns on all options
  # equivalent to trace_n_times: 9999999999 trace_arithmetic_exceptions: true trace_register_stack: true, show_running_time_statistics: true,  list_source_lines: 10,and list_profile_source_lines: 10.
  def verbose=(new_value)
    @verbose = verify_boolean(new_value)
  end

  # boolean
  # turns off all options
  # note: this is an MMIX-level instruction, so -q may still be present with the other flags in output
  def quiet=(new_value)
    @quiet = verify_boolean(new_value)
  end

  # Integer
  # set the buffer size of the virtual machine. Note: the MMIX implementation will cap it at 72
  def buffer_size=(new_value)
    @buffer_size = verify_non_negative_integer("buffer_size", new_value)
  end

  # Integer
  # sets the capacity of the local register ring to max(256,register_ring_capacity)
  # this number must be a power of 2, MMIX will not fail silently if register_ring_capacity > 256 or is not a power of two. Preserving the output of the simulated machine is part of the charter for this project
  def register_ring_capacity=(new_value)
    @register_ring_capacity = verify_non_negative_integer("register_ring_capacity", new_value)
  end

  # String
  # Use the named file for standard input to the simulated program
  def in_file=(new_value)
    @in_file = verify_file_name(new_value)
  end

  # String
  # Prepare the named file for use by other simulators, instead of actually doing a simulation
  def out_file=(new_value)
    @out_file = verify_file_name(new_value)
  end

  # Converts members to an array of command-line flags
  # returns array of strings
  def to_flags
    flags = []
    append_value_flag(flags, "-t", @trace_n_times)
    append_arithmetic_flag(flags)
    flags << "-r" if @trace_register_stack
    append_boolean_or_value_flag(flags, "-l", @list_source_lines)
    flags << "-s" if @show_running_time_statistics
    flags << "-P" if @show_program_profile
    append_boolean_or_value_flag(flags, "-L", @list_profile_source_lines)
    flags << "-v" if @verbose
    flags << "-q" if @quiet
    append_value_flag(flags, "-b", @buffer_size)
    append_value_flag(flags, "-c", @register_ring_capacity)
    append_value_flag(flags, "-f", @in_file)
    append_value_flag(flags, "-D", @out_file)
    flags
  end

  private

  def append_value_flag(flags, flag, value)
    flags << "#{flag}#{value}" if value
  end

  def append_boolean_or_value_flag(flags, flag, value)
    return unless value
    flags << (value == true ? flag : "#{flag}#{value}")
  end

  def append_arithmetic_flag(flags)
    return unless @trace_arithmetic_exceptions
    suffix = @trace_arithmetic_exceptions == true ? "" : @trace_arithmetic_exceptions.to_s(16).rjust(2, "0")
    flags << "-e#{suffix}"
  end

  def verify_file_name(val)
    return nil if val == ""
    verify_type(val, String)
    unless FILE_NAME_PATTERN.match?(val) && val.length < MAX_FILE_NAME_SIZE
      raise ArgumentError, "invalid file name"
    end
    val
  end

  def verify_non_negative_integer(label, val)
    verify_non_negative(verify_integer(val), label)
  end

  def verify_integer(val)
    verify_type(val, Integer)
  end

  def parse_source_lines(label, val)
    verify_integer_or_boolean(val)
    verify_non_negative(val, label)
    parse_boolean_or_number(val)
  end

  def parse_boolean_or_number(val)
    val === 0 ? nil : val
  end

  def verify_type(val, type)
    raise TypeError, "Expected #{type}, got #{val.class}" unless val.is_a?(type)
    val
  end

  def verify_non_negative(val, name)
    raise ArgumentError, "#{name} may not be negative" if val.is_a?(Integer) && val < 0
    val
  end

  def verify_boolean(val)
    raise TypeError, "Expected boolean, got #{val.class}" unless boolean?(val)
    val
  end

  def verify_integer_or_boolean(val)
    unless val.is_a?(Integer) || boolean?(val)
      raise TypeError, "Expected Integer or boolean, got #{val.class}"
    end
  end

  def boolean?(val)
    val == true || val == false
  end
end
