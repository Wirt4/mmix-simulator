require "test_helper"

class UsersControllerTest <ActionDispatch::IntegrationTest
setup do
    @admin = User.create!(email_address: "admin@test.com",
                          user_name: "administrator",
                          password: "password",
                          role: "admin")
@user = User.create!(email_address: "user@test.com",

                          user_name: "average user",
                          password: "password",
                          role: "user")
  end

test "should allow admin to access index" do
  sign_in_as(@admin)
  get users_url
  assert_response :success
end
test "should not allow userto access index" do
  sign_in_as(@user)
  get users_url
  assert_response :forbidden
end
end
