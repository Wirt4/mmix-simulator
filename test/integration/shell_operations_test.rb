require "test_helper"

class ShellOperationsIntegrationTest < SandboxIntegrationTest
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

    strategy_a = Shell::MMIXStrategyAssembler.new
    assembled_code = Shell::ShellOperations.shell_out("hello_world", strategy_a, source, 5)

    strategy_s = Shell::MMIXStrategySimulator.new
    output = Shell::ShellOperations.shell_out("hello_world", strategy_s, { src: source, bin: assembled_code }, 5)

    assert_equal "Hello World\n", output[0]
  end
end
