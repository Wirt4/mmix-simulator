require "tmpdir"
module ShellOperationsModule
  def shellOut(strategy, input)
    Dir.mktmpdir do |dir|
    strategy.write(dir, input)
    strategy.run("foo")
    end
  end
end
