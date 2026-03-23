require "test_helper"

class SourceTest < ActiveSupport::TestCase
  test "valid source" do
    source = sources(:one)
    assert source.valid?
  end

  test "requires title" do
    source = sources(:one)
    source.title = nil
    assert_not source.valid?
    assert source.errors[:title].any?
  end

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
end
