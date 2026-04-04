require "test_helper"

class UsersIndexTest < ActionView::TestCase
setup do
    @users = [ users(:admin), users(:one) ]
    render template: "users/index"
  end

  test "renders an Edit button for each user" do
    assert_select "button", text: "Edit", count: @users.size
  end

  test "Edit button points to edit user path" do
    assert_select "form[action=?][method=get]", edit_user_path(@users.last) do
      assert_select "button", text: "Edit"
    end
  end

  test "Delete button points to user path with DELETE method" do
      assert_select "form[action=?][method=post]", user_path(@users.last) do
      assert_select "input[name=_method][value=delete]"
      assert_select "button", text: "Delete"
    end
  end
end
