require "test_helper"

class ShellOperationsModuleTest < ActiveSupport::TestCase
  class TestClass
    include ShellOperationsModule
  end

  setup do
    @instance = TestClass.new
  end

  def mockClass(output)
    strategy = Class.new do
      define_method(:run) do |args|
       output
      end
    end
    strategy.new
  end

  test "shellOut returns the output from the strategy's 'run' method" do
    strategy = Class.new do
      def run(args)
        "output"
      end
    end
    simulatorStrategy = mockClass("output")
    assert_equal "output", @instance.shellOut(simulatorStrategy)
  end

  test "shellOut returns the binary output from the strategy's 'run' method" do
    bin = 0b000000000110111100000000011101010000000001110100000000000111000000000000011101010000000001110100
    assemblerStrategy = mockClass(bin)
    assert_equal bin, @instance.shellOut(assemblerStrategy)
  end
end
