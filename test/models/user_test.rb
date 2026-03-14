require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "name must be present" do
    user = User.new(username: "name")
    assert user.valid?
  end
  # test "the truth" do
  #   assert true
  # end
end
