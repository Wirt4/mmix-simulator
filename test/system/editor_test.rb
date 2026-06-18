require "application_system_test_case"

class EditorTest < ApplicationSystemTestCase
  fixtures :all

  setup do
    @user = users(:one)
    @program = mmixal_programs(:two)
  end

  test "golden path: assemble and run a program, output panel appears" do
    visit new_session_url
    fill_in "Email address", with: @user.email_address
    fill_in "Password", with: "password"
    click_on "Sign in"

    visit mmixal_program_url(@program)

    assert_selector ".cm-editor", wait: 5

    click_on "Assemble"

    assert_selector "[data-ide-facade-target='runButton']:not([disabled])", wait: 5

    click_on "Run"

    assert_selector "[data-ide-facade-target='output']:not([hidden])", wait: 5
  end
end
