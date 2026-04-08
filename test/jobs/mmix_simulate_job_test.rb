require "test_helper"

class MMIXSimulateJobTest < ActiveJob::TestCase
  setup do
    @program = mmixal_programs(:one)
    @output = outputs(:one)
    @config = SimulatorConfig.new
    @config.trace_n_times = 2
  end

  def stub_shell_out
    called_with = []
    Shell::ShellOperations.stub :shell_out, proc { |title, strategy, input, timeout|
      called_with << { title: title, strategy: strategy, input: input, timeout: timeout }
    } do
      yield called_with
    end
  end

  test "Job discards if program doesn't exist" do
    @program.destroy
      perform_enqueued_jobs do
        MMIXSimulateJob.perform_later(@program, @output)
      end
      assert_equal true, true
  end

  test "calls shell_out with the parent program's title" do
      stub_shell_out do |called_with|
      MMIXSimulateJob.perform_now(@program, @output)
      assert_equal @program.title, called_with.first[:title]
      end
  end

  test "perform passes a simulator strategy to shell_out" do
    stub_shell_out do |called_with|
     MMIXSimulateJob.perform_now(@program, @output)
       assert_instance_of Shell::MMIXStrategySimulator, called_with.first[:strategy]
    end
  end

  test "calls shell_out with the program's bin" do
    stub_shell_out do |called_with|
      MMIXSimulateJob.perform_now(@program, @output)
      assert_equal @program.binary, called_with.first[:input]
    end
  end

  test "writes traced output to output.trace_output when second call to shell_out succeeds" do
    trace_output = File.binread("test/fixtures/mmix_code/hello_world_verbose_output")
    Shell::ShellOperations.stub :shell_out, trace_output do
      MMIXSimulateJob.perform_now(@program, @output, @config)
    end
    @output.reload
    assert_equal trace_output, @output.trace_output
  end

  test "writes error to output.trace_outpt when shell_out raises" do
    called = false
    Shell::ShellOperations.stub :shell_out, proc {
      if called
        raise StandardError, "unknown error"
      else
        called = true
      end
    } do
      MMIXSimulateJob.perform_now(@program, @output, @config)
    end
    @output.reload
    assert_equal "unknown error", @output.trace_output
  end

  test "writes to output.trace_ouput when shell_out raises: different data" do
    called = false
    Shell::ShellOperations.stub :shell_out, proc {
      if called
      raise StandardError, "another unknown error"
      end
      called = true
    } do
      MMIXSimulateJob.perform_now(@program, @output, @config)
    end
    @output.reload
    assert_equal "another unknown error", @output.trace_output
  end

  test "if configs are present, call shell_out twice" do
      stub_shell_out do |called_with|
      MMIXSimulateJob.perform_now(@program, @output, @config)
      assert_equal 2, called_with.size
      end
  end

  test "if configs are present, initalize strategy twice with different constructors" do
    constructor_mock = Minitest::Mock.new
    constructor_mock.expect(:call, "instance_1", [])
    constructor_mock.expect(:call, "instance_2", [ @config ])
    Shell::MMIXStrategySimulator.stub(:new, constructor_mock) do
      stub_shell_out do
        MMIXSimulateJob.perform_now(@program, @output, @config)
      end
    end
    assert constructor_mock.verify
  end

  test "if configs are not present, call shell_out once" do
      stub_shell_out do |called_with|
      MMIXSimulateJob.perform_now(@program, @output)
      assert_equal 1, called_with.size
      end
  end

  test "if configs are present, call shell_out with same arguments for title and input" do
      stub_shell_out do |called_with|
        @config.verbose = true
        MMIXSimulateJob.perform_now(@program, @output, @config)
        assert_equal called_with.first[:title], called_with.last[:title]
        assert_equal called_with.first[:input], called_with.last[:input]
      end
  end

  test "if shell_out errs on the first run, don't call it the second time" do
      times_called = 0
      Shell::ShellOperations.stub :shell_out, proc {
        times_called += 1
        raise StandardError, "unknown error"
      } do
        MMIXSimulateJob.perform_now(@program, @output)
        assert_equal 1, times_called
    end
  end
end
