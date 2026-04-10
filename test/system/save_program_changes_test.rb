require "application_system_test_case"

class SaveProgramChangesTest <ApplicationSystemTestCase
  # setup
  setup do
    @user = users(:one)
    sign_in_as(@user)
    @program = mmixal_programs(:one)
    @program.user = @user
  end
    test "users can update code title" do
      # inputs: none
      # outputs: none, passes or throws as a void
      # preconditions: a user is signed in
      # postconditions: the information typed in to a form is passed to the mmixal_program patch method
      # navigate to the program's view
      get mmixal_programs_url(@program)
      # click on the title field
      # enter a new title
      # click save
      # assert that the payload was sent to patch
      assert_equal true, false
    end
end
