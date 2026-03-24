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
end
