require "test_helper"

class MMIXALProgramsShowTest < ActionView::TestCase
  setup do
    @mmixal_program = mmixal_programs(:one)
    render template: "mmixal_programs/show"
  end

  test "renders an Assemble button" do
    assert_select "button", text: "Assemble", count: 1
  end

  test "renders a Save button" do
    assert_select "button", text: "Save", count: 1
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

  test "renders a Log Out button has correct path to sign out user" do
    assert_select "form[action=?][method=?]", session_path, "post" do
      assert_select "input[name=?][value=?]", "_method", "delete"
      assert_select "button", "Log Out"
    end
  end

  test "renders the navbar partial" do
    assert_select "nav" do
      assert_select "button", text: "Log Out"
      assert_select ".editor-container", count: 0
    end
  end

  test " renders a Save button has correct path to update the mmixal_program" do
    assert_select "form[action=?][method=?]", mmixal_program_path(@mmixal_program), "post" do
      assert_select "input[name=?][value=?]", "_method", "patch"
      assert_select "button", "Save"
    end
  end
end
