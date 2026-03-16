require "test_helper"

# Public: Tests for the User model.
class UserTest < ActiveSupport::TestCase
  # Public: Verify that email normalization strips leading/trailing
  # whitespace and downcases the address.
  test "downcases and strips email_address" do
    user = User.new(email_address: " DOWNCASED@EXAMPLE.COM ")
    assert_equal("downcased@example.com", user.email_address)
  end

  # Public: Verify that user_name normalization strips and downcases.
  test "downcases and strips user_name" do
    user = User.new(user_name: "  MyUser  ")
    assert_equal("myuser", user.user_name)
  end

  # Public: Verify that the user role predicate works correctly.
  test "user? predicate" do
    user = users(:one)
    assert user.user?
    assert_not user.admin?
  end

  # Public: Verify that the admin role predicate works correctly.
  test "admin? predicate" do
    admin = users(:admin)
    assert admin.admin?
    assert_not admin.user?
  end

  # Public: Verify new users default to the user role (integer value 1).
  test "default role is user" do
    user = User.new
    assert_equal "user", user.role
    assert_equal 1, User.roles["user"]
  end

  # Public: Verify the enum rejects invalid role values via validation.
  # With validate: true, invalid values add a validation error instead of
  # raising ArgumentError.
  test "enum rejects invalid role values" do
    user = User.new(email_address: "test@example.com", user_name: "testuser", password: "password", role: "invalid_role")
    assert_not user.valid?
    assert user.errors[:role].present?
  end

  # Public: Verify email_address presence validation.
  test "email_address presence" do
    user = User.new(user_name: "test", password: "password")
    assert_not user.valid?
    assert_includes user.errors[:email_address], "can't be blank"
  end

  # Public: Verify email_address uniqueness validation.
  test "email_address uniqueness" do
    existing = users(:one)
    user = User.new(email_address: existing.email_address, user_name: "newuser", password: "password")
    assert_not user.valid?
    assert_includes user.errors[:email_address], "has already been taken"
  end

  # Public: Verify user_name presence validation.
  test "user_name presence" do
    user = User.new(email_address: "test@example.com", password: "password")
    assert_not user.valid?
    assert_includes user.errors[:user_name], "can't be blank"
  end

  # Public: Verify user_name uniqueness (case-insensitive via normalization).
  test "user_name uniqueness is case-insensitive" do
    existing = users(:one)
    user = User.new(email_address: "other@example.com", user_name: existing.user_name.upcase, password: "password")
    assert_not user.valid?
    assert_includes user.errors[:user_name], "has already been taken"
  end
end
