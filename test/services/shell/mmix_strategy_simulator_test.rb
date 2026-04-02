require "test_helper"
class MMIXStrategySimulatorTest < ActiveSupport::TestCase
  setup do
    @title = "code_doc_title"
    @dir = "/some/dir"
    @rlimit = Rails.application.config.mmix_virtual_memory_limit_bytes
    @fsize  = Rails.application.config.mmix_file_size_limit_bytes
  end

  private

  def stub_write_to_file
    writes = []
    Shell::ShellOperations.stub :write_to_file, proc { |dir, filename, extension, content|
      writes << { dir: dir, filename: filename, extension: extension, content: content }
    } do
      yield writes
    end
  end

  def stub_execute_with_timeout
    args = {}
    Shell::ShellOperations.stub :execute_with_timeout, proc { |dir, command, timeout|
      args[:directory] = dir
      args[:command] = command
      args[:timeout] = timeout
    } do
      yield args
    end
  end

  test "is a subclass of AbstractMMIXStrategy" do
    assert Shell::MMIXStrategySimulator < Shell::AbstractMMIXStrategy
  end

  test "create file executable.mmo in the given directory" do
    stub_write_to_file do |writes|
      strategy = Shell::MMIXStrategySimulator.new
      strategy.write("executable", @dir, { src: "", bin: 0b11011 })

      mmo_write = writes.find { |w| w[:extension] == ".mmo" }
      assert_equal @dir, mmo_write[:dir]
      assert_equal "executable", mmo_write[:filename]
    end
  end

  test "create file executable.mms in the given directory" do
    stub_write_to_file do |writes|
      strategy = Shell::MMIXStrategySimulator.new
      strategy.write("executable", @dir, { src: "<source code>", bin: 0b11011 })

      mms_write = writes.find { |w| w[:extension] == ".mms" }
      assert_equal @dir, mms_write[:dir]
      assert_equal "executable", mms_write[:filename]
    end
  end

  test "writes the bin from the input to the mmo file" do
    stub_write_to_file do |writes|
      strategy = Shell::MMIXStrategySimulator.new
      bin_data = "\x00\x01\x02\x03".b
      strategy.write(@title, @dir, { src: "", bin: bin_data })

      mmo_write = writes.find { |w| w[:extension] == ".mmo" }
      assert_equal bin_data, mmo_write[:content]
    end
  end

  test "writes the str from the input to the mms file" do
    stub_write_to_file do |writes|
      strategy = Shell::MMIXStrategySimulator.new
      src = "<some very cool source code>"
      strategy.write(@title, @dir, { src: src, bin: 0b11011 })

      mms_write = writes.find { |w| w[:extension] == ".mms" }
      assert_equal src, mms_write[:content]
    end
  end

  test "a strategy with no intialized flags calls the executable with proper wrapping" do
    stub_execute_with_timeout do |args|
      strategy = Shell::MMIXStrategySimulator.new
      strategy.run(@title, @dir, 30)

      assert_equal args[:command], [ "landrun-and-limit", "--rox", "/usr", "--rox", "/lib", "--ro", "/etc", "--ro", @dir,
        "--rlimit-as", "#{@rlimit}", "--rlimit-fsize", "#{@fsize}",
        "mmix", "#{@title}.mmo" ]
    end
  end

  test "given that the strategy is intializied with a hash of containing t:2, when strategy.run is called, the flag -t2 should be passed to the commands in the right place" do
    stub_execute_with_timeout do |args|
      strategy = Shell::MMIXStrategySimulator.new({ t: 2 })
      strategy.run(@title, @dir, 30)

      assert_equal args[:command], [ "landrun-and-limit", "--rox", "/usr", "--rox", "/lib", "--ro", "/etc", "--ro", @dir,
        "--rlimit-as", "#{@rlimit}", "--rlimit-fsize", "#{@fsize}",
        "mmix", "-t2", "#{@title}.mmo" ]
    end
  end

  test "given that the strategy is intializied with a hash of containing t:5, when strategy.run is called, the flag -t5 should be passed to the commands in the right place" do
    stub_execute_with_timeout do |args|
      strategy = Shell::MMIXStrategySimulator.new({ t: 5 })
      strategy.run(@title, @dir, 30)

      assert_includes(args[:command], "-t5")
    end
  end

  test "given that the strategy is intializied with a hash of containing e:0XFF, when strategy.run is called, the flag -eff should be passed to the commands" do
    stub_execute_with_timeout do |args|
      strategy = Shell::MMIXStrategySimulator.new({ e: 0xFF })
      strategy.run(@title, @dir, 30)

      assert_includes(args[:command], "-eff")
    end
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
      stub_execute_with_timeout do |args|
        strategy = Shell::MMIXStrategySimulator.new(flag)
        strategy.run(@title, @dir, 30)
        assert_includes(args[:command], expected)
      end
    end
  end

  test "multiple flags may be passed in" do
    stub_execute_with_timeout do |args|
      strategy = Shell::MMIXStrategySimulator.new({ t: 2, l: true, L: true })
      strategy.run(@title, @dir, 30)
      assert_includes(args[:command], "-t2")
      assert_includes(args[:command], "-l")
      assert_includes(args[:command], "-L")
    end
  end

  test "silently omits unsanctioned flags( -i is a valid Knuth flag, but not a part of the current use case)" do
    stub_execute_with_timeout do |args|
      strategy = Shell::MMIXStrategySimulator.new({ i: true })
      strategy.run(@title, @dir, 30)
      assert_not_includes(args[:command], "-i")
    end
  end

  test "-t flag may only be an integer" do
    stub_execute_with_timeout do |args|
      strategy = Shell::MMIXStrategySimulator.new({ t: true })
      strategy.run(@title, @dir, 30)
      assert_not_includes(args[:command], "-t")
      strategy = Shell::MMIXStrategySimulator.new({ t: "string" })
      strategy.run(@title, @dir, 30)
      assert_not_includes(args[:command], "-tstring")
    end
  end

  test "e flag may only be either a hex or standalong" do
    stub_execute_with_timeout do |args|
      strategy = Shell::MMIXStrategySimulator.new({ e: true })
      strategy.run(@title, @dir, 30)
      assert_includes(args[:command], "-e")
      strategy = Shell::MMIXStrategySimulator.new({ e: 0xAA })
      strategy.run(@title, @dir, 30)
      assert_includes(args[:command], "-eaa")
      strategy = Shell::MMIXStrategySimulator.new({ e: 2 })
      strategy.run(@title, @dir, 30)
      assert_not_includes(args[:command], "-e2")
      strategy = Shell::MMIXStrategySimulator.new({ e: "string" })
      strategy.run(@title, @dir, 30)
      assert_not_includes(args[:command], "-estring")
    end
  end

  %i[r s P v q].each do |flag|
    test "#{flag} flag is only a standalone" do
      stub_execute_with_timeout do |args|
        strategy = Shell::MMIXStrategySimulator.new({ flag => 5 })
        strategy.run(@tilte, @dir, 30)
        assert_not_includes(args[:command], "-#{flag}5")
        assert_not_includes(args[:command], "-#{flag}")
      end
    end
  end

  %i[l L].each do |flag|
    test "#{flag} is either a standalone or number" do
      stub_execute_with_timeout do |args|
        strategy = Shell::MMIXStrategySimulator.new({ flag => true })
        strategy.run(@title, @dir, 30)
        assert_includes(args[:command], "-#{flag}")
        strategy = Shell::MMIXStrategySimulator.new({ flag => 10 })
        strategy.run(@title, @dir, 30)
        assert_includes(args[:command], "-#{flag}10")
        strategy = Shell::MMIXStrategySimulator.new({ flag => "string" })
        assert_not_includes(args[:command], "-#{flag}string")
      end
    end
  end

  %i[c b].each do |flag|
    test "#{flag} may only be a number" do
      stub_execute_with_timeout do |args|
        strategy = Shell::MMIXStrategySimulator.new({ flag => true })
        strategy.run(@tilte, @dir, 30)
        assert_not_includes(args[:command], "-#{flag}")
        strategy = Shell::MMIXStrategySimulator.new({ flag => "string" })
        strategy.run(@title, @dir, 30)
        assert_not_includes(args[:command], "-#{flag}string")
      end
    end
  end

  %i[f D].each do |flag|
  test "#{flag} flag must be a string" do
    stub_execute_with_timeout do |args|
      strategy = Shell::MMIXStrategySimulator.new({ flag => true })
      strategy.run(@title, @dir, 30)
      assert_not_includes(args[:command], "-#{flag}")
      strategy = Shell::MMIXStrategySimulator.new({ flag => 10 })
      strategy.run(@tilte, @dir, 30)
      assert_not_includes(args[:command], "-#{flag}10")
    end
  end
  end
end
