require "test_helper"

class UsersEditTest < ActionView::TestCase
  test "'Back' link directs to users index" do
    @user = users(:one)
    render template: "users/edit"
    assert_select "a[href=?]", users_path, text: "Back"
  end
end
