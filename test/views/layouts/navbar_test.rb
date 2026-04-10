require "test_helper"

class LayoutsNavbarTest < ActionView::TestCase
  setup do
    render partial: "layouts/navbar"
  end

  test "renders a Log Out button with correct path to sign out user" do
    assert_select "form[action=?][method=?]", session_path, "post" do
      assert_select "input[name=?][value=?]", "_method", "delete"
      assert_select "button", "Log Out"
    end
  end
end
