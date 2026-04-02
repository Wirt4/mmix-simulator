require "test_helper"

class MMIXAssembleJobTest < ActiveJob::TestCase
  setup do
    @program = programs(:one)
    @executable = executables(:one)
  end

  def stub_shell_out
    called_with = []
    Shell::ShellOperations.stub :shell_out, proc { |title, strategy, input, timeout|
      called_with << { title: title, strategy: strategy, input: input, timeout: timeout }
    } do
      yield called_with
    end
  end

  test "perform passes arguments to shell_out" do
    stub_shell_out do |called_with|
      MMIXAssembleJob.perform_now(@program, @executable)
      assert_equal 1, called_with.size
      assert_equal called_with.first[:title], @program.title
      assert_equal called_with.first[:input], @program.body
    end
  end

  test "perform passes the config value to timeout" do
    stub_shell_out do |called_with|
      MMIXAssembleJob.perform_now(@program, @executable)
      assert_equal Rails.configuration.assembler_timeout, called_with.first[:timeout]
    end
  end

  test "perform passes variable arguments to shell_out" do
    alt_program = programs(:two)
    stub_shell_out do |called_with|
      MMIXAssembleJob.perform_now(alt_program, @executable)
      assert_equal 1, called_with.size
      assert_equal called_with.first[:title], alt_program.title
      assert_equal called_with.first[:input], alt_program.body
    end
  end

  test "perform passes an assembler strategy to shell_out" do
    stub_shell_out do |called_with|
     MMIXAssembleJob.perform_now(@program, @executable)
       assert_instance_of Shell::MMIXStrategyAssembler, called_with.first[:strategy]
    end
  end

  test "Job discards if program doesn't exist" do
    @program.destroy
      perform_enqueued_jobs do
        MMIXAssembleJob.perform_later(@program, @executable)
      end
      assert_equal true, true
  end

  test "sets successfully_assembled to true and writes bin when shell_out succeeds" do
    shell_output = [ 0b0000000001100100000000000110000100000000011101000000000001100001 ].pack("Q>")
    Shell::ShellOperations.stub :shell_out, shell_output do
      MMIXAssembleJob.perform_now(@program, @executable)
    end
    @executable.reload
    assert_equal true, @executable.successfully_assembled
    assert_equal shell_output, @executable.bin
  end

  test "sets successfully_assembled to false when shell_out raises" do
    Shell::ShellOperations.stub :shell_out, proc { raise StandardError, "assembly failed" } do
      MMIXAssembleJob.perform_now(@program, @executable)
    end
    assert_equal false, @executable.reload.successfully_assembled
  end

  test "Job discards if executable doesn't exist" do
    @executable.destroy
      perform_enqueued_jobs do
        MMIXAssembleJob.perform_later(@program, @executable)
      end
      assert_equal true, true
  end
end
