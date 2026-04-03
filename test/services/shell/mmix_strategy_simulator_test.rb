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

  test "a strategy may only accept a SimultaorConfig object" do
    error = assert_raises(TypeError) {
      Shell::MMIXStrategySimulator.new({ t: 5 })
    }
    assert_equal "Expected SimulatorConfig, got Hash", error.message
  end

  test "when a simulator strategy is intialized with a non-config object it throws a specific message" do
    error = assert_raises(TypeError) {
      Shell::MMIXStrategySimulator.new("verbose")
    }
    assert_equal "Expected SimulatorConfig, got String", error.message
  end

  test "given that the strategy is intializied with a simulatorConfig, when strategy.run is called, the output of simulatorConfig.parseFlags should be passed to the commands in the right place" do
    mmix_flags = [ "-t2", "-l", "-L" ]
    expected = [
      "landrun-and-limit",
      "--rox",
      "/usr",
      "--rox",
      "/lib",
      "--ro",
      "/etc",
      "--ro",
      @dir,
      "--rlimit-as",
      "#{@rlimit}",
      "--rlimit-fsize",
      "#{@fsize}",
      "mmix",
      "-t2", "-l", "-L",
      "#{@title}.mmo" ]

    stub_execute_with_timeout do |args|
      config = SimulatorConfig.new
      config.stub(:to_flags, mmix_flags) do
        strategy = Shell::MMIXStrategySimulator.new(config)
        strategy.run(@title, @dir, 30)
        assert_equal args[:command], expected
      end
    end
  end
end
