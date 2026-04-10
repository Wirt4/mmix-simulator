require "test_helper"
require "action_view/testing/resolvers"

class MMIXALProgramsShowTest < ActionView::TestCase
  setup do
    @mmixal_program = mmixal_programs(:one)
    # partials require stubbing with an eye on how they're relative to the current directory
    stub = ActionView::FixtureResolver.new(
      "layouts/_navbar.html.erb" => "",
      "mmixal_programs/_editor.html.erb" => "",
      "_editor.html.erb" => ""
    )
    controller.prepend_view_path(stub)
    render template: "mmixal_programs/show"
  end

  test "renders a link named 'back'" do
    assert_select "a" do
      assert_select "a[href=?]", mmixal_programs_path, text: "back", count: 1
      end
  end

  test "renders an Output panel with a pre area" do
    assert_select "div.output-container" do
      assert_select ".output-header .output-title", text: "Output"
      assert_select ".output-body pre.output-pre"
    end
  end
end
