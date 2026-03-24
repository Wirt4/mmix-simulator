require "test_helper"

class ExecutableTest < ActiveSupport::TestCase
  test "Executable model exists" do
    assert defined?(Executable), "Expected Executable model to be defined"
  end

  test "executable has many outputs" do
    assert_equal :has_many, Executable.reflect_on_association(:outputs).macro
  end
end
