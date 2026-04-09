require "test_helper"
class MMIXALProgramsIndexTest < ActionView::TestCase
  setup do
    @mmixal_programs = [ mmixal_programs(:two), mmixal_programs(:one) ]
    render template: "mmixal_programs/index"
  end

  test "Renders a 'Create New' button" do
    assert_select "button", text: "Create New", count: 1
  end

  test "Create New button submits a POST to mmixal_programs_path" do
    assert_select "form[action=?][method=?]", mmixal_programs_path, "post" do
      assert_select "button", text: "Create New"
    end
   end
end
