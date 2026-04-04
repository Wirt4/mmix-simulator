require "test_helper"
class SimulatorConfigTest < ActiveSupport::TestCase
  setup do
    @config = SimulatorConfig.new
  end

  # Happy path tests
  test "an empty instance returns an empty array for to_flags" do
    flags = @config.to_flags
    assert_equal [], flags
  end
  test "setting trace_n_times affects the return array" do
    @config.trace_n_times = 2
    assert_equal [ "-t2" ], @config.to_flags
  end

  test "setting trace_arithmetic_exceptions to true results in an '-e' flag" do
     @config.trace_arithmetic_exceptions = true
    assert_equal [ "-e" ], @config.to_flags
  end

  test "setting trace_arithmetic_exceptions to a hex value affects the flag" do
     @config.trace_arithmetic_exceptions = 0x80
    assert_equal [ "-e80" ], @config.to_flags
  end

  test "setting trace_register stack produces a flag" do
    @config.trace_register_stack = true
    assert_equal [ "-r" ], @config.to_flags
  end

   test "setting list_source_lines with an integer produces a flag" do
    @config.list_source_lines = 2
    assert_equal [ "-l2" ], @config.to_flags
  end

  test "setting list_source_lines with true produces a flag" do
    @config.list_source_lines = true
    assert_equal [ "-l" ], @config.to_flags
  end

  test "setting show_running_time_statistics to true produces a flag " do
    @config.show_running_time_statistics = true
    assert_equal [ "-s" ], @config.to_flags
  end

  test "setting show_program_profile to true produces a flag " do
    @config.show_program_profile = true
    assert_equal [ "-P" ], @config.to_flags
  end

  test "setting list_profile_source_lines with an integer produces a flag " do
    @config.list_profile_source_lines = 5
    assert_equal [ "-L5" ], @config.to_flags
  end

  test "setting list_profile_source_lines with a boolean produces a flag " do
    @config.list_profile_source_lines = true
    assert_equal [ "-L" ], @config.to_flags
  end

  test "setting verbose to true produces a flag " do
    @config.verbose = true
  assert_equal [ "-v" ], @config.to_flags
  end

  test "setting in_file with a valid file name sets a flag" do
    @config.in_file = "My_validFileName56.txt"
    assert_equal [ "-fMy_validFileName56.txt" ], @config.to_flags
  end

  test "setting quiet to true produces a flag" do
    @config.quiet = true
    assert_equal [ "-q" ], @config.to_flags
  end

  test "setting out_file with a valid file name sets a flag" do
    @config.out_file = "My_validFileName56.txt"
    assert_equal [ "-DMy_validFileName56.txt" ], @config.to_flags
  end

  # Edge and error cases
  test "setting trace_n_times with alternate trace value" do
    @config.trace_n_times = 6
    assert_equal [ "-t6" ], @config.to_flags
  end

  test "setting trace_n_times to 0 negates it" do
    @config.trace_n_times = 6
    @config.trace_n_times = 0
    assert_equal [], @config.to_flags
  end

  test "trace_n_times may only be an integer" do
    error = assert_raises(TypeError) {
      @config.trace_n_times = "six"
    }
    assert_equal "Expected Integer, got String", error.message
  end

  test "trace_n_times may not less than 0" do
    error = assert_raises(ArgumentError) {
      @config.trace_n_times = -1
    }
    assert_equal "trace_n_times may not be negative", error.message
  end

    test "setting trace_arithmetic_exceptions to a hex value affects the flag, check leading zeros" do
     @config.trace_arithmetic_exceptions = 0x0D
    assert_equal [ "-e0d" ], @config.to_flags
  end

  test "trace_arithmetic_exceptiosn may only be an integer or boolean" do
    error = assert_raises(TypeError) {
      @config.trace_arithmetic_exceptions = "FF"
    }
    assert_equal "Expected Integer or boolean, got String", error.message
  end

  test "trace_arithmetic_exceptions enforces the range necessary for bitmask" do
    error = assert_raises(ArgumentError) {
      @config.trace_arithmetic_exceptions = 256
    }
    assert_equal "bitmask must be hexidecmal value between 0x00 and 0xFF", error.message
  end

    test "trace_register_stack may only be a boolean" do
    error = assert_raises(TypeError) {
      @config.trace_register_stack = "trace"
    }
    assert_equal "Expected boolean, got String", error.message
  end

  test "setting list_source_lines with 0 nullifies it" do
    @config.list_source_lines = 0
    assert_equal [], @config.to_flags
  end

  test "list_source_lines may only be a boolean or integer" do
    error = assert_raises(TypeError) {
      @config.list_source_lines = "bad entry"
    }
    assert_equal "Expected Integer or boolean, got String", error.message
  end

  test "list_source_lines may not be negative" do
      error = assert_raises(ArgumentError) {
      @config.list_source_lines = -1
    }
    assert_equal "list_source_lines may not be negative", error.message
  end
  test "show_running_time_statistics may only be a boolean" do
    error = assert_raises(TypeError) {
      @config.show_running_time_statistics = "stats"
    }
    assert_equal "Expected boolean, got String", error.message
  end
    test "show_program_profile may only be a boolean" do
    error = assert_raises(TypeError) {
      @config.show_program_profile = "stats"
    }
    assert_equal "Expected boolean, got String", error.message
  end

  test "list_profile_source_lines may only be a boolean or integer" do
    error = assert_raises(TypeError) {
      @config.list_profile_source_lines = "bad entry"
    }
    assert_equal "Expected Integer or boolean, got String", error.message
  end

  test "list_profile_source_lines may not be negative" do
      error = assert_raises(ArgumentError) {
      @config.list_profile_source_lines = -1
    }
    assert_equal "list_profile_source_lines may not be negative", error.message
  end

  test "verbose may only be a boolean" do
    error = assert_raises(TypeError) {
      @config.verbose = "stats"
    }
    assert_equal "Expected boolean, got String", error.message
  end

  test "quiet may only be a boolean" do
    error = assert_raises(TypeError) {
    @config.quiet = "quiet"
    }
    assert_equal "Expected boolean, got String", error.message
  end

  test "setting buffer_size with an integer produces a flag" do
    @config.buffer_size = 50
    assert_equal [ "-b50" ], @config.to_flags
  end

  test "buffer_size may only be an integer" do
    error = assert_raises(TypeError) {
      @config.buffer_size = "six"
    }
    assert_equal "Expected Integer, got String", error.message
  end

  test "buffer_size may not be negative" do
    error = assert_raises(ArgumentError) {
      @config.buffer_size = -1
    }
     assert_equal "buffer_size may not be negative", error.message
  end

  test "setting register_ring_capacity with a number sets a flag" do
    @config.register_ring_capacity = 64
    assert_equal [ "-c64" ], @config.to_flags
  end

  test "register_ring_capacity may only be an integer" do
    error = assert_raises(TypeError) {
      @config.register_ring_capacity = "sixteen"
    }
    assert_equal "Expected Integer, got String", error.message
  end

  test "register_ring_capacity may not be negative" do
    error = assert_raises(ArgumentError) {
      @config.register_ring_capacity = -1
    }
     assert_equal "register_ring_capacity may not be negative", error.message
  end

  test "in_file may not accept a name that implies a change in direcotry" do
    error = assert_raises(ArgumentError) {
      @config.in_file = "./../etc/passwd"
    }
     assert_equal "invalid file name", error.message
  end

  test "in_file does not allow null bytes injection" do
    error = assert_raises(ArgumentError) {
      @config.in_file = "legit.txt\0.mmo"
    }
     assert_equal "invalid file name", error.message
  end

  test "in_file does not allow file names longer than 255 chars" do
    too_long = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.txt"

    assert_operator too_long.length, :>, 255

     error = assert_raises(ArgumentError) {
      @config.in_file = too_long
     }
     assert_equal "invalid file name", error.message
  end

  test "in_file may be in subdirectory" do
    @config.in_file = "dir/file.txt"
    assert_equal [ "-fdir/file.txt" ], @config.to_flags
  end

  test "empty strings nullify the flag" do
    @config.in_file = ""
    assert_equal [], @config.to_flags
  end

  test "in_file must be a String" do
    error = assert_raises(TypeError) {
      @config.in_file = 42
    }
    assert_equal "Expected String, got Integer", error.message
  end

  test "out_file may not accept a name that implies a change in direcotry" do
    error = assert_raises(ArgumentError) {
      @config.out_file = "./../etc/passwd"
    }
     assert_equal "invalid file name", error.message
  end

  test "shakedown test with the full set" do
    expected = [
      "-t48",
      "-e0a",
      "-r",
      "-l10",
      "-s",
      "-P",
      "-L",
      "-v",
      "-q",
      "-b72",
      "-c32",
      "-fresources/myInput.txt",
      "-DprepareForNextSim"
    ]

    @config.trace_n_times = 48
    @config.trace_arithmetic_exceptions =  0x0A
    @config.trace_register_stack = true
    @config.show_running_time_statistics = true
    @config.list_source_lines = 10
    @config.show_program_profile = true
    @config.list_profile_source_lines = true
    @config.verbose = true
    @config.quiet = true
    @config.buffer_size = 72
    @config.register_ring_capacity = 32
    @config.in_file = "resources/myInput.txt"
    @config.out_file = "prepareForNextSim"

    assert_equal expected, @config.to_flags
  end

  test "shakedown test, set order doesn't matter to output" do
    expected = [
      "-t48",
      "-e0a",
      "-r",
      "-l10",
      "-s"
   ]

    @config.show_running_time_statistics = true
    @config.trace_n_times = 48
    @config.trace_register_stack = true
    @config.trace_arithmetic_exceptions =  0x0A
    @config.list_source_lines = 10

    assert_equal expected, @config.to_flags
  end
end
