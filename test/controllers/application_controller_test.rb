require "test_helper"

class ApplicationControllerTest < ActiveSupport::TestCase
  test "includes Authentication concern" do
    assert ApplicationController.ancestors.include?(Authentication)
  end
end
