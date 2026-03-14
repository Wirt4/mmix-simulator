require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "name must be present" do
    user = User.new(user_name: "name")
    assert user.valid?
  end
  test "name must not be blank" do
    user= User.new(user_name: "    ")
    assert !user.valid?
 end
end
