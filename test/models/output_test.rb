require "test_helper"

class OutputTest <ActiveSupport::TestCase
  test "valid output" do
    output = outputs(:one)
    assert output.valid?
  end

  test "has a body field" do
    output = Output.new(body: "Hello, World!")
    assert_equal "Hello, World!", output.body
  end
end
