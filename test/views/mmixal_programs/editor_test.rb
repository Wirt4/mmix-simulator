require "test_helper"

class MMIXALProgramsEditor < ActionView::TestCase
  setup do
    @mmixal_program = mmixal_programs(:one)
    render partial: "mmixal_programs/editor", locals: { mmixal_program: @mmixal_program }
  end

  test "renders the program title in a form text field" do
    assert_select "form" do
      assert_select "input[type='text'][value=?]", @mmixal_program.title
    end
    # assert_includes rendered, @mmixal_program.title
  end

  test "the program source in a form text area" do
    assert_select "form" do
      assert_select "textarea[spellcheck='false'][autocomplete='off'][autocorrect='off'][autocapitalize='off']", @mmixal_program.source
    end
  end

 test "renders an Output panel with a pre area" do
    assert_select "div.output-container" do
      assert_select ".output-header .output-title", text: "Output"
      assert_select ".output-body textarea.output-pre"
    end
  end

  test "Save button submits a PATCH to the program's update path" do
    assert_select "form[action=?][method=?]", mmixal_program_path(@mmixal_program), "post" do
      assert_select "input[name=?][value=?]", "_method", "patch"
      assert_select "input[type=submit][value=?]", "Save"
    end
  end
end
