require "tmpdir"
require "open3"
module Shell
  module ShellOperations
  module_function
  # Public: Execute an MMIX program by writing it to a temporary directory
  # and running it via the given strategy.
  #
  # strategy - A strategy object that responds to #write and #run, responsible
  #            for writing the input to file and executing the MMIX toolchain.
  # input    - Text or Binary containing the MMIX asset to run.
  # timeout  - An Integer specifying the maximum number of seconds to allow
  #            the strategy to run (default: 30).
  #
  # Returns the result of strategy.run.
  def shellOut(strategy, input, timeout = 30)
    Dir.mktmpdir do |dir|
    strategy.write(dir, input)
    strategy.run(dir, timeout)
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
  def executeWithTimeout(dir, commandArrary, timeout)
    thread = Thread.new { Open3.capture3(*commandArrary, chdir: dir
) }
    result = thread.join(timeout)
    if result.nil?
      thread.kill
      raise "runtime exceeded #{timeout} seconds"
    end
    thread.value
  end
  def writeToFile(dir, filename, content)
      File.write(File.join(dir, filename), content)
  end
  end
end
