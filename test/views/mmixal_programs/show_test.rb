require "test_helper"

class MMIXALProgramsShowTest < ActionView::TestCase
  setup do
    render template: "mmixal_programs/show"
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

  test "renders one 'Log Out' button" do
    assert_select "button", text: "Log Out", count: 1
  end

  test " renders a Log Out button has correct path to sign out user" do
    assert_select "form[action=?][method=?]", session_path, "post" do
      assert_select "input[name=?][value=?]", "_method", "delete"
      assert_select "button", "Log Out"
    end
  end
end
