require "test_helper"

class MmixStrategyAssemblerTest < ActiveSupport::TestCase
  setup do
    @title = "good_code_doc"
    @strategy = Shell::MmixStrategyAssembler.new
    @dir = "/tmp/fake_dir"
    @writes = {}

    writes = @writes
    @original_write = File.method(:binwrite)
    File.define_singleton_method(:binwrite) do |path, data, **opts|
      writes[:path] = path
      writes[:contents] = data
      writes[:opts] = opts
    end

    @contents = "	LOC	Data_Segment\n
	GREG	@\n
Text	BYTE	\"Hello world!\",10,0\n

        LOC	#100\b

Main	LDA	$255,Text\n
	TRAP	0,Fputs,StdOut\n
	TRAP	0,Halt,0"

    @original_execute_with_timeout = Shell::ShellOperations.method(:executeWithTimeout)

    @original_read = File.method(:binread)
    File.define_singleton_method(:binread) do |_path, **_opts|
      ""
    end
 end

  teardown do
    File.define_singleton_method(:binwrite, @original_write)
    File.define_singleton_method(:binread, @original_read)
    Shell::ShellOperations.define_singleton_method(:executeWithTimeout, @original_execute_with_timeout)
  end

  test "is a subclass of AbstractMMIXStrategy" do
    assert Shell::MmixStrategyAssembler < Shell::AbstractMmixStrategy
  end

  test "create file program.mms in the given directory" do
    @strategy.write("program", @dir, @contents)

    assert_equal File.join(@dir, "program.mms"), @writes[:path]
  end
  test "create file my_code.mms in the given directory" do
    @strategy.write("my_code", @dir, @contents)

    assert_equal File.join(@dir, "my_code.mms"), @writes[:path]
  end

  test "write to the program in the given directory with the given contents" do
    @strategy.write(@title, @dir, @contents)

    assert_equal @contents, @writes[:contents]
  end

  test "write creates program.mms in the given directory with different contents" do
    contents = "LOC #100\nMain TRAP 0,Halt,0\n"

    @strategy.write(@title, @dir, contents)

    assert_equal contents, @writes[:contents]
  end

    test "write creates program.mms in the given directory with diffent directory name" do
    dir ="/alternate/fake_dir/path"

    @strategy.write("program", dir, @contents)

    assert_equal File.join(dir, "program.mms"), @writes[:path]
  end

  test "write writes .mms in text mode (no binary flag)" do
    @strategy.write(@title, @dir, @contents)

    assert_not_equal "wb", @writes.fetch(:opts, {})[:mode]
  end

  test "run passes timeout to executeWithTimeout" do
    timeout = 10
    received_timeout = nil

    Shell::ShellOperations.define_singleton_method(:executeWithTimeout) do |_dir, _command, t|
      received_timeout = t
    end

    @strategy.run(@title, @dir, timeout)

    assert_equal timeout, received_timeout
  end

  test "run passes different timeout to executeWithTimeout" do
    timeout = 5
    received_timeout = nil

    Shell::ShellOperations.define_singleton_method(:executeWithTimeout) do |_dir, _command, t|
      received_timeout = t
    end

    @strategy.run(@title, @dir, timeout)

    assert_equal timeout, received_timeout
  end

  test "run calls command line utility `bwrap-seccomp`" do
    received_command = nil

    Shell::ShellOperations.define_singleton_method(:executeWithTimeout) do |_dir, command, _t|
      received_command = command
    end

    @strategy.run("program", @dir, 1)

    assert_equal received_command, [ "bwrap-seccomp", "-a", "mmixal", "program.mms" ]
  end
  test "run calls command line utility `bwrap-seccomp` with different name" do
    received_command = nil

    Shell::ShellOperations.define_singleton_method(:executeWithTimeout) do |_dir, command, _t|
      received_command = command
    end

    @strategy.run("my_code", @dir, 1)

    assert_equal received_command, [ "bwrap-seccomp", "-a", "mmixal", "my_code.mms" ]
  end

  test "run returns variable contents of the compiled.mmo" do
    mmo_contents = 01101001001001110110110100100000011000100110000101110100011011010110000101101110

    Shell::ShellOperations.define_singleton_method(:executeWithTimeout) do |_dir, _command, _t|
    end

    dir = @dir
    File.define_singleton_method(:binread) do |path, **_opts|
      if path === File.join(dir, "expected.mmo")
  mmo_contents
      else
  raise "non-matching path"
      end
    end

    result = @strategy.run("expected", @dir, 1)

    assert_equal mmo_contents, result
  end

  test "passes dir to executeWithTimeout" do
    received_dir = nil

    Shell::ShellOperations.define_singleton_method(:executeWithTimeout) do |dir, _command, _t|
      received_dir = dir
    end

    @strategy.run(@title, @dir, 1)

    assert_match received_dir, @dir
  end
end
