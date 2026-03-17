require "test_helper"

class UsersControllerTest <ActionDispatch::IntegrationTest
setup do
    @admin = User.create!(email_address: "admin@test.com", user_name: "administrator", password: "password", role: "admin")
  end

test "should allow admin to access index" do
  sign_in_as(@admin)
  get users_url
  assert_response :success
end
end
