require "test_helper"

class ShellOperationsStressIntegrationTest < SandboxIntegrationTest
  test "sandbox enforces memory and disk limits on stress program" do
    source = File.binread("test/fixtures/mmix_code/stress.mms")

    strategy_a = Shell::MMIXStrategyAssembler.new
    assembled_code = Shell::ShellOperations.shell_out("stress", strategy_a, source, 5)

    strategy_s = Shell::MMIXStrategySimulator.new
    output =Shell::ShellOperations.shell_out("stress", strategy_s, { src: source, bin: assembled_code }, 30)

    stdout = output[0]

    # The sandbox should kill the process before it finishes.
    # If limits are enforced, we should never see the "not enforced" messages.
    refute_includes stdout, "RAM limit not enforced!",
      "sandbox failed to enforce the 75 MB memory limit"
    refute_includes stdout, "Disk limit not enforced!",
      "sandbox failed to enforce the 128 MB disk size limit"
  end
end
