require "test_helper"

class ProgramTest < ActiveSupport::TestCase
  test "valid program" do
    program = programs(:one)
    assert program.valid?
  end
  test "requires title" do
    program = programs(:one)
    program.title = nil
    assert_not program.valid?
    assert program.errors[:title].any?
  end
=begin
  test "requires body" do
    source = sources(:one)
    source.body = nil
    assert_not source.valid?
    assert source.errors[:body].any?
  end

  test "belongs to user" do
    source = sources(:one)
    assert_equal users(:one), source.user
  end

  test "destroying user destroys sources" do
    user = users(:one)
    assert_difference("Source.count", -1) do
      user.destroy
    end
  end
=end
end
