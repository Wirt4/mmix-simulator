require "test_helper"
class MmixStrategySimulatorTest < ActiveSupport::TestCase
  setup do
    @title = "code_doc_title"
    @file_writes = []
    @dir = "/some/dir"
    @received_command = nil

    file_writes = @file_writes
    received_command_ref = ->(cmd) { @received_command = cmd }

    @original_write_to_file = Shell::ShellOperations.method(:writeToFile)
    Shell::ShellOperations.define_singleton_method(:writeToFile) do |dir, filename, content, is_binary = false|
      file_writes << { dir: dir, filename: filename, content: content, is_binary: is_binary }
    end
    @original_execute_with_timeout = Shell::ShellOperations.method(:executeWithTimeout)
    Shell::ShellOperations.define_singleton_method(:executeWithTimeout) do |_dir, command, _t|
      received_command_ref.call(command)
    end
  end

  teardown do
    Shell::ShellOperations.define_singleton_method(:writeToFile, @original_write_to_file)
    Shell::ShellOperations.define_singleton_method(:executeWithTimeout, @original_execute_with_timeout)
  end

  test "is a subclass of AbstractMMIXStrategy" do
    assert Shell::MmixStrategySimulator < Shell::AbstractMmixStrategy
  end

  # todo: do the below two tests with a different title
  test "create file executable.mmo in the given directory" do
    strategy = Shell::MmixStrategySimulator.new
    strategy.write("executable", @dir, { src: "", bin: 0b11011 })

    mmo_write = @file_writes.find { |w| w[:filename].end_with?(".mmo") }
    assert_equal @dir, mmo_write[:dir]
    assert_equal "executable.mmo", mmo_write[:filename]
  end

  test "create file executable.mms in the given directory" do
    strategy = Shell::MmixStrategySimulator.new
    strategy.write("executable", @dir, { src: "<source code>", bin: 0b11011 })

    mms_write = @file_writes.find { |w| w[:filename].end_with?(".mms") }
    assert_equal @dir, mms_write[:dir]
    assert_equal "executable.mms", mms_write[:filename]
  end

  test "writes the bin from the input to the mmo file" do
    strategy = Shell::MmixStrategySimulator.new
    bin_data = "\x00\x01\x02\x03".b
    strategy.write(@title, @dir, { src: "", bin: bin_data })

    mmo_write = @file_writes.find { |w| w[:filename].end_with?(".mmo") }
    assert_equal bin_data, mmo_write[:content]
  end

  test "writes the str from the input to the mms file" do
    strategy = Shell::MmixStrategySimulator.new
    src = "<some very cool source code>"
    strategy.write(@title, @dir, { src: src, bin: 0b11011 })

    mms_write = @file_writes.find { |w| w[:filename].end_with?(".mms") }
    assert_equal src, mms_write[:content]
  end

  test "a strategy with no intialized flags calls the executable with proper wrapping" do
    strategy = Shell::MmixStrategySimulator.new

    strategy.run(@title, @dir, 30)

    assert_equal @received_command, [ "bwrap-seccomp", "-e", "mmix", "#{@title}.mmo" ]
  end

  test "given that the strategy is intializied with a hash of containing t:2, when strategy.run is called, the flag -t2 should be passed to the commands in the right place" do
    strategy = Shell::MmixStrategySimulator.new({ t: 2 })

    strategy.run(@title, @dir, 30)

    assert_equal @received_command, [ "bwrap-seccomp", "-e", "mmix", "-t2", "#{@title}.mmo" ]
  end

  test "given that the strategy is intializied with a hash of containing t:5, when strategy.run is called, the flag -t5 should be passed to the commands in the right place" do
    strategy = Shell::MmixStrategySimulator.new({ t: 5 })

    strategy.run(@title, @dir, 30)

    assert_includes(@received_command, "-t5")
  end

  test "given that the strategy is intializied with a hash of containing e:0XFF, when strategy.run is called, the flag -eff should be passed to the commands" do
    strategy = Shell::MmixStrategySimulator.new({ e: 0xFF })

    strategy.run(@title, @dir, 30)

    assert_includes(@received_command, "-eff")
  end

  [
    { flag: { r: true }, expected: "-r" },
    { flag: { l: 10 }, expected: "-l10" },
    { flag: { s: true }, expected: "-s" },
    { flag: { P: true }, expected: "-P" },
    { flag: { L: 11 }, expected: "-L11" },
    { flag: { v: true }, expected: "-v" },
    { flag: { q: true }, expected: "-q" },
    { flag: { b: 60 }, expected: "-b60" },
    { flag: { c: 128 }, expected: "-c128" },
    { flag: { f: "a_file_name" }, expected: "-fa_file_name" },
    { flag: { D: "a_file_name" }, expected: "-Da_file_name" }
  ].each do |opts|
    expected = opts[:expected]
    flag = opts[:flag]
    test "flag #{expected} is passed to the command" do
      strategy = Shell::MmixStrategySimulator.new(flag)
      strategy.run(@title, @dir, 30)
      assert_includes(@received_command, expected)
    end
  end

  test "multiple flags may be passed in" do
    strategy = Shell::MmixStrategySimulator.new({ t: 2, l: true, L: true })
    strategy.run(@title, @dir, 30)
    assert_includes(@received_command, "-t2")
    assert_includes(@received_command, "-l")
    assert_includes(@received_command, "-L")
  end

  test "silently omits unsanctioned flags( -i is a valid Knuth flag, but not a part of the current use case)" do
    strategy = Shell::MmixStrategySimulator.new({ i: true })
    strategy.run(@title, @dir, 30)
    assert_not_includes(@received_command, "-i")
  end

  test "-t flag may only be an integer" do
    strategy = Shell::MmixStrategySimulator.new({ t: true })
    strategy.run(@title, @dir, 30)
    assert_not_includes(@received_command, "-t")
    strategy = Shell::MmixStrategySimulator.new({ t: "string" })
    strategy.run(@title, @dir, 30)
    assert_not_includes(@received_command, "-tstring")
  end

  test "e flag may only be either a hex or standalong" do
    strategy = Shell::MmixStrategySimulator.new({ e: true })
    strategy.run(@title, @dir, 30)
    assert_includes(@received_command, "-e")
    strategy = Shell::MmixStrategySimulator.new({ e: 0xAA })
    strategy.run(@title, @dir, 30)
    assert_includes(@received_command, "-eaa")
    strategy = Shell::MmixStrategySimulator.new({ e: 2 })
    strategy.run(@title, @dir, 30)
    assert_not_includes(@received_command, "-e2")
    strategy = Shell::MmixStrategySimulator.new({ e: "string" })
    strategy.run(@title, @dir, 30)
    assert_not_includes(@received_command, "-estring")
  end

  %i[r s P v q].each do |flag|
    test "#{flag} flag is only a standalone" do
      strategy = Shell::MmixStrategySimulator.new({ flag => 5 })
      strategy.run(@tilte, @dir, 30)
      assert_not_includes(@received_command, "-#{flag}5")
      assert_not_includes(@received_command, "-#{flag}")
    end
  end

  %i[l L].each do |flag|
    test "#{flag} is either a standalone or number" do
      strategy = Shell::MmixStrategySimulator.new({ flag => true })
      strategy.run(@tite, @dir, 30)
      assert_includes(@received_command, "-#{flag}")
      strategy = Shell::MmixStrategySimulator.new({ flag => 10 })
      strategy.run(@title, @dir, 30)
      assert_includes(@received_command, "-#{flag}10")
      strategy = Shell::MmixStrategySimulator.new({ flag => "string" })
      assert_not_includes(@received_command, "-#{flag}string")
    end
  end

  %i[c b].each do |flag|
    test "#{flag} may only be a number" do
      strategy = Shell::MmixStrategySimulator.new({ flag => true })
      strategy.run(@tilte, @dir, 30)
      assert_not_includes(@received_command, "-#{flag}")
      strategy = Shell::MmixStrategySimulator.new({ flag => "string" })
      strategy.run(@title, @dir, 30)
      assert_not_includes(@received_command, "-#{flag}string")
    end
  end

  %i[f D].each do |flag|
  test "#{flag} flag must be a string" do
    strategy = Shell::MmixStrategySimulator.new({ flag => true })
    strategy.run(@title, @dir, 30)
    assert_not_includes(@received_command, "-#{flag}")
    strategy = Shell::MmixStrategySimulator.new({ flag => 10 })
    strategy.run(@tilte, @dir, 30)
    assert_not_includes(@received_command, "-#{flag}10")
  end
  end
end
