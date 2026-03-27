require "test_helper"

class ShellOperationsJailbreakIntegrationTest < ActionDispatch::IntegrationTest
  test "jailbreak code cannot write files outside the sandbox" do
    source = File.binread("test/fixtures/mmix_code/jailbreak.mms")

    strategy_a = Shell::MmixStrategyAssembler.new
    assembled_code = Shell::ShellOperations.shellOut("jailbreak", strategy_a, source, 5)

    strategy_s = Shell::MmixStrategySimulator.new
    Shell::ShellOperations.shellOut("jailbreak", strategy_s, { src: source, bin: assembled_code }, 5)

    # The sandbox should prevent the path traversal write.
    # No "jailbreak" file should exist in the default tmpdir parent or working directory.
    refute File.exist?(File.join(Dir.tmpdir, "jailbreak")),
      "jailbreak file escaped sandbox into #{Dir.tmpdir}"
    refute File.exist?(File.join(Dir.pwd, "jailbreak")),
      "jailbreak file escaped sandbox into working directory"
  end
end
