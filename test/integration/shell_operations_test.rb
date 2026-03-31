require "test_helper"

class ShellOperationsIntegrationTest < ActionDispatch::IntegrationTest
def setup
  skip "Sandbox tests disabled" unless ENV["RUN_SANDBOX_TESTS"]
end
  test "assemble and simulate hello world" do
    source = <<~MMIX
      \tLOC\tData_Segment
      \tGREG\t@
      Text\tBYTE\t"Hello World",10,0

      \tLOC\t#100

      Main\tLDA\t$255,Text
      \tTRAP\t0,Fputs,StdOut
      \tTRAP\t0,Halt,0
    MMIX

    strategy_a = Shell::MmixStrategyAssembler.new
    assembled_code = Shell::ShellOperations.shellOut("hello_world", strategy_a, source, 5)

    strategy_s = Shell::MmixStrategySimulator.new
    output = Shell::ShellOperations.shellOut("hello_world", strategy_s, { src: source, bin: assembled_code }, 5)

    assert_equal "Hello World\n", output[0]
  end
end
