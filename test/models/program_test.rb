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
end
