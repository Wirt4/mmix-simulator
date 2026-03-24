require "test_helper"

class ProgramTest < ActiveSupport::TestCase
  setup do
    @program = programs(:one)
  end
  test "valid program" do
    assert @program.valid?
  end
  test "requires title" do
    @program.title = nil
    assert_not @program.valid?
    assert @program.errors[:title].any?
  end
  test "requires body" do
    @program.body = nil
    assert_not @program.valid?
    assert @program.errors[:body].any?
  end
  test "can have one executable" do
    assert_respond_to @program, :executable
    assert_nil @program.executable
  end
  test "destroying program destroys associated executable" do
    executable = Executable.create!(body: "compiled", program_id: @program.id)
    @program.destroy!
    assert_not Executable.exists?(executable.id)
  end
end
