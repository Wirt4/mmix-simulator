require "test_helper"

class ShellOperationsModuleTest < ActiveSupport::TestCase
  class TestClass
    include ShellOperationsModule
  end

  setup do
    @instance = TestClass.new
  end

  test "shellOut returns the output from the strategy's 'run' method" do
    strategy = Class.new do
      def run(args)
        "output"
      end
    end

    assert_equal "output", @instance.shellOut(strategy)
  end
end
