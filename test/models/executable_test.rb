require "test_helper"

class ExecutableTest < ActiveSupport::TestCase
  test "executable has many outputs" do
    assert_equal :has_many, Executable.reflect_on_association(:outputs).macro
  end

  test "bin is a binary column" do
    assert_equal :binary, Executable.columns_hash["bin"].type
  end

  test "executable must have a bin" do
    executable = Executable.new
    assert_not executable.valid?
    assert_includes executable.errors[:bin], "can't be blank"
  end

  test "destroying an executable also destroys its outputs" do
    executable = Executable.create!(bin: 10001, program_id: programs(:one).id)
    output = executable.outputs.create!(console_output: "Hello, World!", exit_value: 0, trace_output: "foo")

    assert_difference "Output.count", -1 do
      executable.destroy!
    end
  end
end
