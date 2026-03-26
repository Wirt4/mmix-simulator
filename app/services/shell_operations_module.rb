require "tmpdir"
module ShellOperationsModule
  def shellOut(strategy, input)
    Dir.mktmpdir do |dir|
    strategy.write(dir, input)
    strategy.run(dir)
    end
  end
end
