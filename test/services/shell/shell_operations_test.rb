require "test_helper"
require "open3"

class ShellOperationsTest < ActiveSupport::TestCase
  setup do
    @doc_title = "best_program_ever"
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
     @tmpdir = "/tmp/fake_tmpdir"
  end

  def stubMktmpdir(&test_block)
    fake_mktmpdir = ->(&blk) { blk.call(@tmpdir) }
    Dir.stub(:mktmpdir, fake_mktmpdir, &test_block)
  end

  def strategyDouble(output)
    strategy = Class.new do
      define_method(:run) do |title, args, timeout|
       output
      end
      def write(title, dir, args)
      end
   end
    strategy.new
  end

  test "shellOut returns the output from the strategy's 'run' method" do
    simulatorStrategy = strategyDouble(@mmix_output)
    stubMktmpdir do
      assert_equal @mmix_output, Shell::ShellOperations.shellOut(@doc_title, simulatorStrategy, @mmix_machine_code)
    end
  end

  test "shellOut returns the binary output from the strategy's 'run' method" do
    assemblerStrategy = strategyDouble(@mmix_machine_code)
    stubMktmpdir do
      assert_equal @mmix_machine_code, Shell::ShellOperations.shellOut(@doc_title, assemblerStrategy, @mmix_machine_code)
    end
  end

  test "shellOut passes the input to the strategy's write method" do
    simulatorStrategy = strategyDouble(@mmix_machine_code)
    written_input = nil
    fake_write = ->(title, dir, input) { written_input = input }
    stubMktmpdir do
      simulatorStrategy.stub(:write, fake_write) do
        Shell::ShellOperations.shellOut(@doc_title, simulatorStrategy, @mmix_machine_code)
      end
    end
    assert_equal @mmix_machine_code, written_input
  end

  test "shellOut passes the Dir.mktmpdir path to strategy.write" do
    written_dir = nil
    assemblerStrategy = strategyDouble(@mmix_program)
    fake_write = ->(title, dir, input) { written_dir = dir }
    stubMktmpdir do
      assemblerStrategy.stub(:write, fake_write) do
        Shell::ShellOperations.shellOut(@doc_title, assemblerStrategy, @mmix_machine_code)
      end
    end
    assert_equal @tmpdir, written_dir
  end

  test "shellOut passes the Dir.mktmpdir path to strategy.run" do
     working_dir = nil
     assemblerStrategy = strategyDouble(@mmix_program)
     fake_run = ->(title, dir, timeout) { working_dir = dir }
     stubMktmpdir do
       assemblerStrategy.stub(:run, fake_run) do
         Shell::ShellOperations.shellOut(@doc_title, assemblerStrategy, @mmix_machine_code)
       end
     end
     assert_equal @tmpdir, working_dir
  end

  test "shellOut passes 2 second timeout constraint to strategy.run" do
     actual_timeout = -1
     assemblerStrategy = strategyDouble(@mmix_program)
     fake_run = ->(title, dir, timeout) { actual_timeout = timeout }
     expected_timeout = 2
     stubMktmpdir do
       assemblerStrategy.stub(:run, fake_run) do
         Shell::ShellOperations.shellOut(@doc_title, assemblerStrategy, @mmix_machine_code, expected_timeout)
       end
     end
     assert_equal expected_timeout, actual_timeout
  end

  test "shellOut passes 30 second timeout constraint to strategy.run" do
     actual_timeout = -1
     assemblerStrategy = strategyDouble(@mmix_program)
     fake_run = ->(title, dir, timeout) { actual_timeout = timeout }
     expected_timeout = 30
     stubMktmpdir do
       assemblerStrategy.stub(:run, fake_run) do
         Shell::ShellOperations.shellOut(@doc_title, assemblerStrategy, @mmix_machine_code, expected_timeout)
       end
     end
     assert_equal expected_timeout, actual_timeout
  end

  test "shellOut passes title to strategy.run and strategy.write" do
     actual_write_title = ""
     actual_run_title = ""
     assemblerStrategy = strategyDouble(@mmix_program)
     fake_run = ->(title, _dir, _timeout) { actual_run_title = title }
     fake_write = ->(title, _dir, _input) { actual_write_title = title }
     stubMktmpdir do
       assemblerStrategy.stub(:run, fake_run) do
         assemblerStrategy.stub(:write, fake_write) do
           Shell::ShellOperations.shellOut(@doc_title, assemblerStrategy, @mmix_machine_code, 6)
         end
       end
     end
     assert_equal @doc_title, actual_run_title
     assert_equal @doc_title, actual_write_title
  end


  test "executeWithTimeout raises runtime error when command exceeds timeout" do
    slow_command = [ "sleep", "5" ]
    slow_capture = ->(*_args) { sleep(5) }
    Open3.stub(:capture3, slow_capture) do
      assert_raises(RuntimeError) do
        Shell::ShellOperations.executeWithTimeout(@tmpdir, slow_command, 2)
      end
    end
  end

  test "executeWithTimeout raises specific error message when command exceeds timeout" do
    slow_command = [ "sleep", "5" ]
    slow_capture = ->(*_args) { sleep(5) }
    Open3.stub(:capture3, slow_capture) do
      exception = assert_raises(RuntimeError) do
        Shell::ShellOperations.executeWithTimeout(@tmpdir, slow_command, 2)
      end
      assert_match("runtime exceeded 2 seconds", exception.message)
    end
  end

  test "executeWithTimeout raises specific error message when command exceeds timeout: different data" do
    slow_command = [ "sleep", "5" ]
    slow_capture = ->(*_args) { sleep(5) }
    Open3.stub(:capture3, slow_capture) do
      exception = assert_raises(RuntimeError) do
        Shell::ShellOperations.executeWithTimeout(@tmpdir, slow_command, 3)
      end
      assert_match("runtime exceeded 3 seconds", exception.message)
    end
  end

  test "executeWithTimeout returns an array containing the stdout_s from Open3.capture3" do
    expected_stdout = "Hello, world!\n"
    Open3.stub(:capture3, [ expected_stdout, "", Object.new ]) do
      result = Shell::ShellOperations.executeWithTimeout(@tmpdir, [ "echo", "Hello, world!" ], 2)
      assert_includes(result, expected_stdout, "The result array should include #{expected_stdout}")
    end
  end

  test "executeWithTimeout returns an array containing the stdout_s from Open3.capture3: different data" do
    expected_stdout = "Greetings Program\n"
    Open3.stub(:capture3, [ expected_stdout, "", Object.new ]) do
      result = Shell::ShellOperations.executeWithTimeout(@tmpdir, [ "echo", "Greetings Program" ], 2)
      assert_includes(result, expected_stdout, "The result array should include #{expected_stdout}")
    end
  end

  test "executeWithTimeout returns an array including the stderr_s from Open3.capture3" do
    expected_stderr = "something went wrong\n"
    Open3.stub(:capture3, [ "", expected_stderr, Object.new ]) do
      result = Shell::ShellOperations.executeWithTimeout(@tmpdir, [ "echo", "ignored" ], 2)
      assert_includes(result, expected_stderr, "The result array should include #{expected_stderr}")
    end
  end

  test "executeWithTimeout returns an array of size 3, the same as the return from Open3" do
    Open3.stub(:capture3, [ "some value", "", Object.new ]) do
      result = Shell::ShellOperations.executeWithTimeout(@tmpdir, [ "echo", "ignored" ], 2)
      assert_equal(3, result.size)
    end
  end

  test "executeWithTimeout executes the command inside the specified directory" do
    captured_dir = nil
    fake_capture3 = ->(*args) {
      captured_dir = args.last[:chdir]
      [ "", "", Object.new ]
    }
    Open3.stub(:capture3, fake_capture3) do
      Shell::ShellOperations.executeWithTimeout(@tmpdir, [ "echo", "hello" ], 2)
    end
    assert_equal @tmpdir, captured_dir
  end

  test "executeWithTimeout executes the command inside a different specified directory" do
    captured_dir = nil
    fake_capture3 = ->(*args) {
      captured_dir = args.last[:chdir]
      [ "", "", Object.new ]
    }
    dir = "/random/other/directory"
    Open3.stub(:capture3, fake_capture3) do
      Shell::ShellOperations.executeWithTimeout(dir, [ "echo", "hello" ], 2)
    end
    assert_equal dir, captured_dir
  end

  ## writeToFile tests

  test "writeToFile writes content to the correct path" do
    written_path = nil
    fake_binwrite = ->(path, data) { written_path = path }
    File.stub(:binwrite, fake_binwrite) do
      Shell::ShellOperations.writeToFile("/some/dir", "test.mmo", "content")
    end
    assert_equal "/some/dir/test.mmo", written_path
  end

  # test "writeToFile writes content to a different path" do
  #   written_path = nil
  #   fake_binwrite = ->(path, data) { written_path = path }
  #   File.stub(:binwrite, fake_binwrite) do
  #     Shell::ShellOperations.writeToFile("/other/dir", "program.mms", "source")
  #   end
  #   assert_equal "/other/dir/program.mms", written_path
  # end
  #
  # test "writeToFile passes the content to File.binwrite" do
  #   written_data = nil
  #   fake_binwrite = ->(path, data) { written_data = data }
  #   File.stub(:binwrite, fake_binwrite) do
  #     Shell::ShellOperations.writeToFile("/some/dir", "test.mmo", "the content")
  #   end
  #   assert_equal "the content", written_data
  # end
  #
  # test "writeToFile passes binary content to File.binwrite" do
  #   written_data = nil
  #   fake_binwrite = ->(path, data) { written_data = data }
  #   bin_data = "\x00\x01\x02\x03".b
  #   File.stub(:binwrite, fake_binwrite) do
  #     Shell::ShellOperations.writeToFile("/some/dir", "test.mmo", bin_data)
  #   end
  #   assert_equal bin_data, written_data
  # end
  #
  # test "writeToFile joins directory and filename into a single path" do
  #   written_path = nil
  #   fake_binwrite = ->(path, data) { written_path = path }
  #   File.stub(:binwrite, fake_binwrite) do
  #     Shell::ShellOperations.writeToFile("/tmp/workdir", "hello.mms", "source code")
  #   end
  #   assert_equal File.join("/tmp/workdir", "hello.mms"), written_path
  # end
end
