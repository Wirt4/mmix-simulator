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

  test "Each program entry has a Delete button" do
    assert_select "button", text: "Delete", count: @mmixal_programs.size
  end

  test "Each program entry has an Open button" do
    assert_select "button", text: "Open", count: @mmixal_programs.size
  end

  test "Open button links to the program's show page" do
    @mmixal_programs.each do |program|
      assert_select "a[href=?]", mmixal_program_path(program), text: "Open"
    end
  end

  test "Delete button submits a DELETE to the program's path" do
    @mmixal_programs.each do |program|
      assert_select "form[action=?][method=?]", mmixal_program_path(program), "post" do
        assert_select "input[name=_method][value=delete]"
        assert_select "button", text: "Delete"
      end
    end
  end
end
