module ShellOperationsModule
  def shellOut(strategy, input)
    strategy.write(input)
    strategy.run("foo")
  end
end
