require "test_helper"

class ShellOperationsIntegrationTestVerbose < SandboxIntegrationTest
   test "want to be sure test with flags matches" do
    source = File.binread("test/fixtures/mmix_code/hello_world.mms")
    strategy_a = Shell::MmixStrategyAssembler.new
    title ="hello_world"
    assembled_code = Shell::ShellOperations.shellOut(title, strategy_a, source, 5)
    strategy_s = Shell::MmixStrategySimulator.new({ v: true })
    expected_output =File.binread("test/fixtures/mmix_code/hello_world_verbose_output")
    output = Shell::ShellOperations.shellOut(title, strategy_s, { src: source, bin: assembled_code }, 5)
    assert_equal expected_output, output[0]
  end
end
