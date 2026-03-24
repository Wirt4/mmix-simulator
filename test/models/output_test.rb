require "test_helper"

class OutputTest <ActiveSupport::TestCase
  test "valid output" do
    output = outputs(:one)
    assert output.valid?
  end

  test "has a console_output field" do
    output = Output.new(console_output: "Hello, World!")
    assert_equal "Hello, World!", output.console_output
  end

  test "console_output must be text" do
    output = outputs(:one)
    output.console_output = 123
    assert_not output.valid?
    assert output.errors[:console_output].any?
  end

  test "requires console_output" do
    output = outputs(:one)
    output.console_output = nil
    assert_not output.valid?
    assert output.errors[:console_output].any?
  end

  test "requires executable" do
    output = outputs(:one)
    output.executable = nil
    assert_not output.valid?
    assert output.errors[:executable].any?
  end

  test "requires exit_value" do
    output = outputs(:one)
    output.exit_value = nil
    assert_not output.valid?
    assert output.errors[:exit_value].any?
  end

  test "exit_value must be an integer" do
    output = outputs(:one)
    output.exit_value = "not_an_integer"
    assert_not output.valid?
    assert output.errors[:exit_value].any?
  end

  test "has a trace_output field" do
    output = Output.new(trace_output: "trace data")
    assert_equal "trace data", output.trace_output
  end

  test "trace_output is nullable" do
    output = outputs(:one)
    output.trace_output = nil
    assert output.valid?
  end

  test "trace_output must be text" do
    output = outputs(:one)
    output.trace_output = 123
    assert_not output.valid?
    assert output.errors[:trace_output].any?
  end

  test "has a flags field" do
    output = Output.new(flags: "-v")
    assert_equal "-v", output.flags
  end

  test "flags must be text" do
    output = outputs(:one)
    output.flags = 123
    assert_not output.valid?
    assert output.errors[:flags].any?
  end
end
