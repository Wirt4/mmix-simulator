require "test_helper"

class ConsoleIndexTest < ActionView::TestCase
  setup do
    render template: "console/index"
  end

  test "renders an Assemble button" do
    assert_select "button", text: "Assemble", count: 1
  end

  test "renders a Run button" do
    assert_select "button", text: "Run", count: 1
  end

  test "renders an Output editor panel with a `pre` area for output" do
    assert_select "div.output-container" do
      assert_select ".output-header .output-title", text: "Output"
      assert_select ".output-body pre.output-pre"
    end
  end
end
