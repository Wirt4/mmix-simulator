require "test_helper"
require "open3"
require "stringio"

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

  def stub_mktmpdir(&test_block)
    fake_mktmpdir = ->(&blk) { blk.call(@tmpdir) }
    Dir.stub(:mktmpdir, fake_mktmpdir, &test_block)
  end

  def strategy_double(output)
    strategy = Class.new do
      define_method(:run) do |title, args, timeout|
       output
      end
      def write(title, dir, args)
      end
   end
    strategy.new
  end

  def fake_popen3(stdout_s, stderr_s, status)
    stdin = StringIO.new
    stdout = StringIO.new(stdout_s)
    stderr = StringIO.new(stderr_s)
    wait_thr = Thread.new { status }
    wait_thr.define_singleton_method(:pid) { 0 }
    [ stdin, stdout, stderr, wait_thr ]
  end

  def blocking_popen3
    child_pid = Process.spawn("sleep", "60")
    stdin = StringIO.new
    stdout = StringIO.new("")
    stderr = StringIO.new("")
    wait_thr = Thread.new { Process.wait(child_pid); $? }
    wait_thr.report_on_exception = false
    wait_thr.define_singleton_method(:pid) { child_pid }
    [ child_pid, [ stdin, stdout, stderr, wait_thr ] ]
  end

  test "shell_out returns the output from the strategy's 'run' method" do
    simulator_strategy = strategy_double(@mmix_output)
    stub_mktmpdir do
      assert_equal @mmix_output, Shell::ShellOperations.shell_out(@doc_title, simulator_strategy, @mmix_machine_code)
    end
  end

  test "shell_out returns the binary output from the strategy's 'run' method" do
    assembler_strategy = strategy_double(@mmix_machine_code)
    stub_mktmpdir do
      assert_equal @mmix_machine_code, Shell::ShellOperations.shell_out(@doc_title, assembler_strategy, @mmix_machine_code)
    end
  end

  test "shell_out passes the input to the strategy's write method" do
    simulator_strategy = strategy_double(@mmix_machine_code)
    written_input = nil
    fake_write = ->(title, dir, input) { written_input = input }
    stub_mktmpdir do
      simulator_strategy.stub(:write, fake_write) do
        Shell::ShellOperations.shell_out(@doc_title, simulator_strategy, @mmix_machine_code)
      end
    end
    assert_equal @mmix_machine_code, written_input
  end

  test "shell_out passes the Dir.mktmpdir path to strategy.write" do
    written_dir = nil
    assembler_strategy = strategy_double(@mmix_program)
    fake_write = ->(title, dir, input) { written_dir = dir }
    stub_mktmpdir do
      assembler_strategy.stub(:write, fake_write) do
        Shell::ShellOperations.shell_out(@doc_title, assembler_strategy, @mmix_machine_code)
      end
    end
    assert_equal @tmpdir, written_dir
  end

  test "shell_out passes the Dir.mktmpdir path to strategy.run" do
     working_dir = nil
     assembler_strategy = strategy_double(@mmix_program)
     fake_run = ->(title, dir, timeout) { working_dir = dir }
     stub_mktmpdir do
       assembler_strategy.stub(:run, fake_run) do
         Shell::ShellOperations.shell_out(@doc_title, assembler_strategy, @mmix_machine_code)
       end
     end
     assert_equal @tmpdir, working_dir
  end

  test "shell_out passes 2 second timeout constraint to strategy.run" do
     actual_timeout = -1
     assembler_strategy = strategy_double(@mmix_program)
     fake_run = ->(title, dir, timeout) { actual_timeout = timeout }
     expected_timeout = 2
     stub_mktmpdir do
       assembler_strategy.stub(:run, fake_run) do
         Shell::ShellOperations.shell_out(@doc_title, assembler_strategy, @mmix_machine_code, expected_timeout)
       end
     end
     assert_equal expected_timeout, actual_timeout
  end

  test "shell_out passes 30 second timeout constraint to strategy.run" do
     actual_timeout = -1
     assembler_strategy = strategy_double(@mmix_program)
     fake_run = ->(title, dir, timeout) { actual_timeout = timeout }
     expected_timeout = 30
     stub_mktmpdir do
       assembler_strategy.stub(:run, fake_run) do
         Shell::ShellOperations.shell_out(@doc_title, assembler_strategy, @mmix_machine_code, expected_timeout)
       end
     end
     assert_equal expected_timeout, actual_timeout
  end

  test "shell_out passes title to strategy.run and strategy.write" do
     actual_write_title = ""
     actual_run_title = ""
     assembler_strategy = strategy_double(@mmix_program)
     fake_run = ->(title, _dir, _timeout) { actual_run_title = title }
     fake_write = ->(title, _dir, _input) { actual_write_title = title }
     stub_mktmpdir do
       assembler_strategy.stub(:run, fake_run) do
         assembler_strategy.stub(:write, fake_write) do
           Shell::ShellOperations.shell_out(@doc_title, assembler_strategy, @mmix_machine_code, 6)
         end
       end
     end
     assert_equal @doc_title, actual_run_title
     assert_equal @doc_title, actual_write_title
  end


  test "execute_with_timeout raises runtime error when command exceeds timeout" do
    child_pid, fake_return = blocking_popen3
    Open3.stub(:popen3, fake_return) do
      assert_raises(RuntimeError) do
        Shell::ShellOperations.execute_with_timeout(@tmpdir, [ "sleep", "5" ], 1)
      end
    end
  ensure
    Process.kill("TERM", child_pid) rescue nil
    Process.wait(child_pid) rescue nil
  end

  test "execute_with_timeout raises specific error message when command exceeds timeout" do
    child_pid, fake_return = blocking_popen3
    Open3.stub(:popen3, fake_return) do
      exception = assert_raises(RuntimeError) do
        Shell::ShellOperations.execute_with_timeout(@tmpdir, [ "sleep", "5" ], 2)
      end
      assert_match("runtime exceeded 2 seconds", exception.message)
    end
  ensure
    Process.kill("TERM", child_pid) rescue nil
    Process.wait(child_pid) rescue nil
  end

  test "execute_with_timeout raises specific error message when command exceeds timeout: different data" do
    child_pid, fake_return = blocking_popen3
    Open3.stub(:popen3, fake_return) do
      exception = assert_raises(RuntimeError) do
        Shell::ShellOperations.execute_with_timeout(@tmpdir, [ "sleep", "5" ], 3)
      end
      assert_match("runtime exceeded 3 seconds", exception.message)
    end
  ensure
    Process.kill("TERM", child_pid) rescue nil
    Process.wait(child_pid) rescue nil
  end

  test "execute_with_timeout returns an array containing the stdout_s from Open3.capture3" do
    expected_stdout = "Hello, world!\n"
    Open3.stub(:popen3, fake_popen3(expected_stdout, "", Object.new)) do
      result = Shell::ShellOperations.execute_with_timeout(@tmpdir, [ "echo", "Hello, world!" ], 2)
      assert_includes(result, expected_stdout, "The result array should include #{expected_stdout}")
    end
  end

  test "execute_with_timeout returns an array containing the stdout_s from Open3.capture3: different data" do
    expected_stdout = "Greetings Program\n"
    Open3.stub(:popen3, fake_popen3(expected_stdout, "", Object.new)) do
      result = Shell::ShellOperations.execute_with_timeout(@tmpdir, [ "echo", "Greetings Program" ], 2)
      assert_includes(result, expected_stdout, "The result array should include #{expected_stdout}")
    end
  end

  test "execute_with_timeout returns an array including the stderr_s from Open3.capture3" do
    expected_stderr = "something went wrong\n"
    Open3.stub(:popen3, fake_popen3("", expected_stderr, Object.new)) do
      result = Shell::ShellOperations.execute_with_timeout(@tmpdir, [ "echo", "ignored" ], 2)
      assert_includes(result, expected_stderr, "The result array should include #{expected_stderr}")
    end
  end

  test "execute_with_timeout returns an array of size 3, the same as the return from Open3" do
    Open3.stub(:popen3, fake_popen3("some value", "", Object.new)) do
      result = Shell::ShellOperations.execute_with_timeout(@tmpdir, [ "echo", "ignored" ], 2)
      assert_equal(3, result.size)
    end
  end

  test "execute_with_timeout kills the child process when command exceeds timeout" do
    child_pid, fake_return = blocking_popen3
    Open3.stub(:popen3, fake_return) do
      assert_raises(RuntimeError) do
        Shell::ShellOperations.execute_with_timeout(@tmpdir, [ "sleep", "60" ], 1)
      end
    end
    # The child process should have been killed — if it's still alive, this assertion fails
    assert_raises(Errno::ESRCH, "Child process #{child_pid} was not killed — it was orphaned") do
      Process.kill(0, child_pid)
    end
  ensure
    Process.kill("TERM", child_pid) rescue nil
    Process.wait(child_pid) rescue nil
  end

  test "execute_with_timeout executes the command inside the specified directory" do
    captured_dir = nil
    fake_popen3 = ->(*args) {
      captured_dir = args.last[:chdir]
      fake_popen3("", "", Object.new)
    }
    Open3.stub(:popen3, fake_popen3) do
      Shell::ShellOperations.execute_with_timeout(@tmpdir, [ "echo", "hello" ], 2)
    end
    assert_equal @tmpdir, captured_dir
  end

  test "execute_with_timeout executes the command inside a different specified directory" do
    captured_dir = nil
    fake_popen3 = ->(*args) {
      captured_dir = args.last[:chdir]
      fake_popen3("", "", Object.new)
    }
    dir = "/random/other/directory"
    Open3.stub(:popen3, fake_popen3) do
      Shell::ShellOperations.execute_with_timeout(dir, [ "echo", "hello" ], 2)
    end
    assert_equal dir, captured_dir
  end

  ## write_to_file tests

  test "write_to_file writes content to the correct path" do
    written_path = nil
    fake_binwrite = ->(path, data) { written_path = path }
    File.stub(:binwrite, fake_binwrite) do
      Shell::ShellOperations.write_to_file("/some/dir", "test", ".mmo", "content")
    end
    assert_equal "/some/dir/test.mmo", written_path
  end

  test "write_to_file writes content to a different path" do
    written_path = nil
    fake_binwrite = ->(path, data) { written_path = path }
    File.stub(:binwrite, fake_binwrite) do
      Shell::ShellOperations.write_to_file("/other/dir", "program", ".mms", "source")
    end
    assert_equal "/other/dir/program.mms", written_path
  end

  test "write_to_file santizies the name" do
    written_path = nil
    fake_binwrite = ->(path, data) { written_path = path }
    File.stub(:binwrite, fake_binwrite) do
      Shell::ShellOperations.write_to_file("/other/dir", "../../etc/cron.d/evil.mms", ".mms", "source")
    end
    assert_equal "/other/dir/evil.mms", written_path
  end


  test "write_to_file passes the content to File.binwrite" do
    written_data = nil
    fake_binwrite = ->(path, data) { written_data = data }
    File.stub(:binwrite, fake_binwrite) do
      Shell::ShellOperations.write_to_file("/some/dir", "test", ".mmo", "the content")
    end
    assert_equal "the content", written_data
  end

  test "write_to_file passes binary content to File.binwrite" do
    written_data = nil
    fake_binwrite = ->(path, data) { written_data = data }
    bin_data = "\x00\x01\x02\x03".b
    File.stub(:binwrite, fake_binwrite) do
      Shell::ShellOperations.write_to_file("/some/dir", "test", ".mmo", bin_data)
    end
    assert_equal bin_data, written_data
  end

  test "write_to_file joins directory and filename into a single path" do
    written_path = nil
    fake_binwrite = ->(path, data) { written_path = path }
    File.stub(:binwrite, fake_binwrite) do
      Shell::ShellOperations.write_to_file("/tmp/workdir", "hello", ".mms", "source code")
    end
    assert_equal File.join("/tmp/workdir", "hello.mms"), written_path
  end
end
