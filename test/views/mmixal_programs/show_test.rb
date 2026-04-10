require "test_helper"

class MMIXALProgramsShowTest < ActionView::TestCase
  setup do
    @mmixal_program = mmixal_programs(:one)
    render template: "mmixal_programs/show"
  end

  # -- Title display and editability --

  test "renders the program title in a text field" do
    assert_select "span.editor-title input[type=text][value=?]", @mmixal_program.title
  end

  test "renders a link named 'back'" do
    assert_select "a" do
      assert_select "a[href=?]", mmixal_programs_path, text: "back", count: 1
      end
  end


  test "the title field is inside a form" do
    assert_select "form input[type=text][value=?]", @mmixal_program.title
  end

  # -- Save button calls update with the program's title --

  test "renders a Save button" do
    assert_select "input[type=submit][value=?]", "Save", count: 1
  end

  test "Save button submits a PATCH to the program's update path" do
    assert_select "form[action=?][method=?]", mmixal_program_path(@mmixal_program), "post" do
      assert_select "input[name=?][value=?]", "_method", "patch"
      assert_select "input[type=submit][value=?]", "Save"
    end
  end

  # -- Editor --

  test "renders an Assemble button" do
    assert_select "button", text: "Assemble", count: 1
  end

  test "renders a Run button" do
    assert_select "button", text: "Run", count: 1
  end

  # -- Output panel --

  test "renders an Output panel with a pre area" do
    assert_select "div.output-container" do
      assert_select ".output-header .output-title", text: "Output"
      assert_select ".output-body pre.output-pre"
    end
  end

  # -- Navbar --

  test "renders the navbar with Log Out" do
    assert_select "nav" do
      assert_select "button", text: "Log Out"
    end
  end

  test "Log Out submits a DELETE to the session path" do
    assert_select "form[action=?][method=?]", session_path, "post" do
      assert_select "input[name=?][value=?]", "_method", "delete"
      assert_select "button", "Log Out"
    end
  end
end
