require "test_helper"
class MMIXALProgramsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
  end
  # GET /mmixal_programs - users should get a 200
  test "should allow user to access index" do
    sign_in_as(@user)
    get mmixal_programs_url
    assert_response :success
  end

  test "POST /mmixal_programs creates a new program for the signed-in user" do
    sign_in_as(@user)
    assert_difference "MMIXALProgram.count", 1 do
      post mmixal_programs_url
    end
    assert_equal @user, MMIXALProgram.last.user
  end

  test "POST /mmixal_programs redirects to the new program's show page" do
    sign_in_as(@user)
    post mmixal_programs_url
    assert_redirected_to mmixal_program_url(MMIXALProgram.last)
  end

  test "DELETE /mmixal_programs/:token destroys the program" do
    sign_in_as(@user)
    program = mmixal_programs(:one)
    assert_difference "MMIXALProgram.count", -1 do
      delete mmixal_program_url(program)
    end
  end

  test "DELETE /mmixal_programs/:token redirects to index" do
    sign_in_as(@user)
    delete mmixal_program_url(mmixal_programs(:one))
    assert_redirected_to mmixal_programs_url
  end

  # GET /mmixal_programs — page lists all user's programs and title
  test "index: list all user's saved programs" do
    sign_in_as(@user)
    get mmixal_programs_url
    assert_response :success
    assert_includes response.body, mmixal_programs(:one).title
    assert_includes response.body, mmixal_programs(:two).title
  end

# PATCH /mmixal_programs/:id updates the program
test "updates mmixal_program source code" do
  sign_in_as(@user)
  program = mmixal_programs(:one)

  patch mmixal_program_url(program), params: {
    mmixal_program: {
      title: "new title",
      source: "new content"
    }
  }, headers: { "HTTP_REFERER" => mmixal_program_url(program) }

  assert_equal "new content", program.reload.source
  assert_redirected_to mmixal_program_url(program)
end

test "PATCH from index redirects back to index" do
  sign_in_as(@user)
  program = mmixal_programs(:one)

  patch mmixal_program_url(program), params: {
    mmixal_program: {
      title: "renamed",
      source: program.source
    }
  }, headers: { "HTTP_REFERER" => mmixal_programs_url }

  assert_equal "renamed", program.reload.title
  assert_redirected_to mmixal_programs_url
end

# The CodeMirror editor renders inside `editorContainer`; the source textarea is
# hidden and acts only as a form-submit shim, so it should carry no visible styling.
test "show: hidden source textarea has no editor-textarea class" do
  sign_in_as(@user)
  program = mmixal_programs(:one)

  get mmixal_program_url(program)

  assert_response :success
  assert_select "textarea[data-ide-facade-target=textarea]" do |textareas|
    assert_equal 1, textareas.size, "expected exactly one source textarea"
    classes = textareas.first["class"].to_s.split
    assert_not_includes classes, "editor-textarea",
      "hidden source textarea should not carry the editor-textarea class"
  end
end
end
