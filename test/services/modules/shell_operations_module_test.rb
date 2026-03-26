require "test_helper"

class ShellOperationsModuleTest < ActiveSupport::TestCase
  class TestClass
    include ShellOperationsModule
  end

  setup do
    @instance = TestClass.new
    @mmix_program = '        LOC   #100                   % Set the address of the program
                                     % initially to 0x100.

Main    GETA  $255,string            % Put the address of the string
                                     % into register 255.

        TRAP  0,Fputs,StdOut         % Write the string pointed to by
                                     % register 255 to the standard
                                     % output file.

        TRAP  0,Halt,0               % End process.

string  BYTE  "Hello, world!",#a,0   % String to be printed.  #a is
                                     % newline, 0 terminates the
                                     % string.'
     @mmix_machine_code = 0b1001100000001001000000010000000101101001110001010100010110000110100110000000001000000001000000001001100000000110000000000000010000000000000000000001000001101000011001010110110001101100011011110101111101110111011011110111001001101100011001000010111001101101011011010111001100000000000000000000000000100000100110000000011100000000000000111111010011111111000000000000000000000000000000000000011100000001000000000000000000000000000000000000000000000000001100001001100000000100000000000000001101001000011001010110110001101100100110000000011100000000000001100110111100101100001000000111011100000000000000000100000010011000000001110000000000000110011011110111001001101100011001001001100000000111000000000000011000100001000010100000000000000000000000000000000001010000100110000000101000000000111111110000000000000000000000000000000000000000000000000000000100000000100110000000101100000000000000000000000000000000011000000010000000111010010000000101000000010000010000000100000000100000010011010010000001100001001000000110100100000010011011100000000100000000000000000111000000000000100000010010000001010011001000000111010000010000000100000010000001110010001000000110100100100000011011100000001001100111000000000000000010000000000000010000110010000010000000001001100000001100000000000000100100001010
     @mmix_output = "Hello, world!"
  end

  def strategyDouble(output)
    strategy = Class.new do
      define_method(:run) do |args|
       output
      end
      def write(dir, args)
      end
    end
    strategy.new
  end

  test "shellOut returns the output from the strategy's 'run' method" do
    simulatorStrategy = strategyDouble(@mmix_output)
    assert_equal @mmix_output, @instance.shellOut(simulatorStrategy, @mmix_machine_code)
  end

  test "shellOut returns the binary output from the strategy's 'run' method" do
    assemblerStrategy = strategyDouble(@mmix_machine_code)
    assert_equal @mmix_machine_code, @instance.shellOut(assemblerStrategy, @mmix_machine_code)
  end

  test "shellOut passes the input to the strategy's write method" do
    simulatorStrategy = strategyDouble(@mmix_machine_code)
    written_input = nil
    simulatorStrategy.define_singleton_method(:write) do |dir, input|
      written_input = input
    end

    @instance.shellOut(simulatorStrategy, @mmix_machine_code)

    assert_equal @mmix_machine_code, written_input
  end
  test "shellOut passes the Dir.mktmpdir path to strategy.write" do
    # double the strategy with a spy on write
    written_dir = nil
    assemblerStrategy = strategyDouble(@mmix_program)
    assemblerStragety.define_singleton_method(:write) do |dir, input|
      written_dir = dir
    end
    # double Dir with a file path
    fake_dir = "/tmp/fake_tmpdir"
    original_mktmpdir = Dir.method(:mktmpdir)
    Dir.define_singleton_method(:mktmpdir) do |&block|
      block.call(fake_dir)
    end

    begin
      @instance.shellOut(strategy, @mmix_machine_code)
    ensure
      # restore Dir.mktmpdir after call
      # ensure block in case of raised error
      Dir.define_singleton_method(:mktmpdir, original_mktmpdir)
    end

    assert_equal fake_dir, written_dir
  end
=begin
  test "shellOut passes the Dir.mktmpdir path to strategy.run" do
    written_dir = nil
    run_dir = nil
    strategy = Class.new do
      define_method(:run) do |args, dir|
        run_dir = dir
        "output"
      end
      define_method(:write) do |input, dir|
        written_dir = dir
      end
    end.new

    fake_dir = "/tmp/fake_tmpdir"
    original_mktmpdir = Dir.method(:mktmpdir)
    Dir.define_singleton_method(:mktmpdir) do |&block|
      block.call(fake_dir)
    end

    begin
      @instance.shellOut(strategy, @mmix_machine_code)
    ensure
      Dir.define_singleton_method(:mktmpdir, original_mktmpdir)
    end

    assert_equal fake_dir, written_dir
    assert_equal fake_dir, run_dir
  end
=end
end
