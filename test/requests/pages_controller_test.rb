require "test_helper"

class PagesControllerTest < ActionDispatch::IntegrationTest
  test "GET / returns landing page" do
    get root_path
    assert_response :success
  end

  test "GET /about returns about page" do
    get about_path
    assert_response :success
  end
end
