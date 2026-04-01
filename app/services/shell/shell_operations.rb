require "tmpdir"
require "open3"

module Shell
  module ShellOperations
  module_function
  # Public: Execute an MMIX program by writing it to a temporary directory
  # and running it via the given strategy.
  #
  # title    - the name of the code to write, minus file extension ("my_wonderful_program" instead of "my_wonderful_program.mms")
  # dir      - the directory where to write the code
  # strategy - A strategy object that responds to #write and #run, responsible
  #            for writing the input to file and executing the MMIX toolchain.
  # input    - Text or Hash containing the MMIX asset to run.
  # timeout  - An Integer specifying the maximum number of seconds to allow
  #            the strategy to run (default: 30).
  #
  # Returns the result of strategy.run.
  def shellOut(title, strategy, input, timeout = 30)
    Dir.mktmpdir do |dir|
    strategy.write(title, dir, input)
    strategy.run(title, dir, timeout)
    end
  end

  # Public: Execute a shell command with a timeout constraint, raising an
  # error if the command does not complete in time.
  #
  # commandArrary - An Array of Strings representing the command and its
  #                 arguments to execute.
  # timeout       - An Integer specifying the maximum number of seconds
  #                 to allow the command to run.
  #
  # Raises RuntimeError if the command exceeds the timeout.
  #
  # Returns an Array of [stdout, stderr, status] from Open3.capture3.
  def executeWithTimeout(dir, command_array, timeout)
    stdin, stdout, stderr, wait_thr = Open3.popen3(*command_array, chdir: dir)
    stdin.close
    pid = wait_thr.pid
    thread = Thread.new { [ stdout.read, stderr.read, wait_thr.value ] }
    result = thread.join(timeout)
    if result.nil?
      Process.kill("TERM", pid)
      Process.wait(pid) rescue nil
      thread.kill
      raise "runtime exceeded #{timeout} seconds"
    end
    thread.value
  ensure
    [ stdin, stdout, stderr ].each { |io| io&.close unless io&.closed? }
  end

  def writeToFile(dir, filename, file_extension, content)
    File.binwrite(File.join(dir, "#{File.basename(filename, ".*")}#{file_extension}"), content)
  end
  end
end
