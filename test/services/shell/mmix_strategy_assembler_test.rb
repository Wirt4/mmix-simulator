require "test_helper"

class MmixStrategyAssemblerTest < ActiveSupport::TestCase
  setup do
    @title = "good_code_doc"
    @strategy = Shell::MmixStrategyAssembler.new
    @dir = "/tmp/fake_dir"
    @writes = {}

    @contents = "	LOC	Data_Segment\n
	GREG	@\n
Text	BYTE	\"Hello world!\",10,0\n

        LOC	#100\b

Main	LDA	$255,Text\n
	TRAP	0,Fputs,StdOut\n
	TRAP	0,Halt,0"
 end

  private

  def stub_binwrite
    writes = {}
    File.stub :binwrite, proc { |path, data, **opts|
      writes[:path] = path
      writes[:contents] = data
      writes[:opts] = opts
    } do
      yield writes
    end
  end

  def stub_execute_with_timeout(stub_binread: true)
    args = {}
    Shell::ShellOperations.stub :executeWithTimeout, proc { |dir, command, timeout|
      args[:directory] = dir
      args[:command] = command
      args[:timeout] = timeout
    } do
      if stub_binread
        File.stub :binread, "" do
          yield args
        end
      else
        yield args
      end
    end
  end

  test "is a subclass of AbstractMMIXStrategy" do
    assert Shell::MmixStrategyAssembler < Shell::AbstractMmixStrategy
  end

  test "create file program.mms in the given directory" do
    stub_binwrite do |writes|
      @strategy.write("program", @dir, @contents)
      assert_equal File.join(@dir, "program.mms"), writes[:path]
    end
  end

    test "create file my_code.mms in the given directory" do
      stub_binwrite do |writes|
        @strategy.write("my_code", @dir, @contents)
        assert_equal File.join(@dir, "my_code.mms"), writes[:path]
      end
    end

    test "write to the program in the given directory with the given contents" do
      stub_binwrite do |writes|
        @strategy.write(@title, @dir, @contents)
        assert_equal @contents, writes[:contents]
      end
    end

    test "write creates program.mms in the given directory with different contents" do
      contents = "LOC #100\nMain TRAP 0,Halt,0\n"
      stub_binwrite do |writes|
        @strategy.write(@title, @dir, contents)
        assert_equal contents, writes[:contents]
      end
    end

    test "write creates program.mms in the given directory with diffent directory name" do
    dir = "/alternate/fake_dir/path"

    stub_binwrite do |writes|
      @strategy.write("program", dir, @contents)
      assert_equal File.join(dir, "program.mms"), writes[:path]
    end
  end

  test "run passes timeout to executeWithTimeout" do
    timeout = 10
    stub_execute_with_timeout do |args|
      @strategy.run(@title, @dir, timeout)
      assert_equal args[:timeout], timeout
    end
  end

  test "run passes different timeout to executeWithTimeout" do
    timeout = 5
    stub_execute_with_timeout do |args|
      @strategy.run(@title, @dir, timeout)
      assert_equal args[:timeout], timeout
    end
  end

  test "run calls command line utility `bwrap-seccomp`" do
    stub_execute_with_timeout do |args|
      @strategy.run("program", @dir, 1)
      assert_equal args[:command], [ "bwrap-seccomp", "-a", "mmixal", "program.mms" ]
    end
  end

  test "run calls command line utility `bwrap-seccomp` with different name" do
    stub_execute_with_timeout do |args|
      @strategy.run("my_code", @dir, 1)
      assert_equal args[:command], [ "bwrap-seccomp", "-a", "mmixal", "my_code.mms" ]
    end
  end

  test "run returns variable contents of the compiled.mmo" do
    mmo_contents = 01101001001001110110110100100000011000100110000101110100011011010110000101101110
    dir = @dir
    stub_execute_with_timeout(stub_binread: false) do |_args|
      File.stub :binread, mmo_contents do
        assert_equal @strategy.run("expected", @dir, 1), mmo_contents
      end
    end
  end

  test "passes dir to executeWithTimeout" do
    stub_execute_with_timeout do |args|
      @strategy.run(@title, @dir, 1)
      assert_match args[:directory], @dir
    end
  end
end
