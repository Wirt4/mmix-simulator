require "test_helper"

class OutputTest <ActiveSupport::TestCase
  test "valid output" do
    output = outputs(:one)
    assert output.valid?
  end
end
