require "test_helper"

class ExecutableTest < ActiveSupport::TestCase
  test "Executable model exists" do
    assert defined?(Executable), "Expected Executable model to be defined"
  end

  test "executable has many outputs" do
    assert_equal :has_many, Executable.reflect_on_association(:outputs).macro
  end

  test "executable must have a body" do
    executable = Executable.new
    assert_not executable.valid?
    assert_includes executable.errors[:body], "can't be blank"
  end

  test "destroying an executable also destroys its outputs" do
    executable = Executable.create!(body: "compiled", program_id: programs(:one).id)
    output = executable.outputs.create!(body: "Hello, World!")

    assert_difference "Output.count", -1 do
      executable.destroy!
    end
  end
end
