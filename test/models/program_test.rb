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

  test "program has many executables" do
    assert_equal :has_many, Program.reflect_on_association(:executables).macro
  end

  test "destroying program destroys associated executables" do
    executables = 3.times.map { Executable.create!(bin: 1001, program_id: @program.id) }
    @program.destroy!
    executables.each { |e| assert_not Executable.exists?(e.id) }
  end
end
