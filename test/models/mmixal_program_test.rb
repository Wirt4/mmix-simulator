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

  test "program has one output" do
    assert_equal :has_one, MMIXALProgram.reflect_on_association(:output).macro
  end

  test "title must be unique per user" do
    duplicate = @program.user.mmixal_programs.build(title: @program.title)
    assert_not duplicate.valid?
    assert duplicate.errors[:title].any?
  end

  test "generates unique default title when Untitled already exists" do
    user = @program.user
    first = user.mmixal_programs.create!(title: MMIXALProgram.default_title_for(user))
    assert_equal "Untitled", first.title
    second = user.mmixal_programs.create!(title: MMIXALProgram.default_title_for(user))
    assert_equal "Untitled (2)", second.title
    third = user.mmixal_programs.create!(title: MMIXALProgram.default_title_for(user))
    assert_equal "Untitled (3)", third.title
  end

  test "source defaults to placeholder value" do
    program = @program.user.mmixal_programs.create!(title: "Default Source Test")
    assert_equal "% write your MMIXAL code here", program.source
  end

  test "destroying program destroys associated output" do
    output = @program.create_output!(mmixal_program_id: @program.id, console_output: "Hello World", exit_value: 0)
    @program.destroy!
  assert_not Output.exists?(output.id)
  end
end
