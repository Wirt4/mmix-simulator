require "tmpdir"
module Shell
  module ShellOperations
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
  end
end
