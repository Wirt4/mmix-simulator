require "test_helper"

class ExecutableTest < ActiveSupport::TestCase
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
    output = executable.outputs.create!(console_output: "Hello, World!", exit_value: 0)

    assert_difference "Output.count", -1 do
      executable.destroy!
    end
  end
end
