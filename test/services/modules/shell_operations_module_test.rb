require "test_helper"

class ShellOperationsModuleTest < ActiveSupport::TestCase
  class TestClass
    include ShellOperationsModule
  end

  setup do
    @instance = TestClass.new
  end

  def strategyDouble(output)
    strategy = Class.new do
      define_method(:run) do |args|
       output
      end
      def write(args)
      end
    end
    strategy.new
  end

  test "shellOut returns the output from the strategy's 'run' method" do
    simulatorStrategy = strategyDouble("output")
    assert_equal "output", @instance.shellOut(simulatorStrategy, 0b001)
  end

  test "shellOut returns the binary output from the strategy's 'run' method" do
    bin = 0b000000000110111100000000011101010000000001110100000000000111000000000000011101010000000001110100
    assemblerStrategy = strategyDouble(bin)
    assert_equal bin, @instance.shellOut(assemblerStrategy, 0b001)
  end

  test "shellOut passes the input to the strategy's write method" do
    simulatorStrategy = strategyDouble("output")
    bin = 0b000000000110111100000000011101010000000001110100000000000111000000000000011101010000000001110100
    written_input = nil
    simulatorStrategy.define_singleton_method(:write) do |input|
      written_input = input
    end

    @instance.shellOut(simulatorStrategy, bin)

    assert_equal bin, written_input
  end
end
