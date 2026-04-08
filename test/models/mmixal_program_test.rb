require "test_helper"

class MMIXALProgramTest < ActiveSupport::TestCase
  setup do
    @program = mmixal_programs(:one)
  end

  test "valid program" do
    assert @program.valid?
  end

  test "requires title" do
    @program.title = nil
    assert_not @program.valid?
    assert @program.errors[:title].any?
  end

  test "requires source" do
    @program.source = nil
    assert_not @program.valid?
    assert @program.errors[:source].any?
  end

  test "program has one output" do
    assert_equal :has_one, MMIXALProgram.reflect_on_association(:output).macro
  end

  test "destroying program destroys associated output" do
    output = @program.create_output!(mmixal_program_id: @program.id, console_output: "Hello World", exit_value: 0)
    @program.destroy!
  assert_not Output.exists?(output.id)
  end
end
