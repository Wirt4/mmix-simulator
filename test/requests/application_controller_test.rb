require "test_helper"

# Public: Unit tests for ApplicationController.
#
# Verifies that the base controller includes the expected concerns
# and behaviors inherited by all other controllers.
class ApplicationControllerTest < ActiveSupport::TestCase
  test "includes Authentication concern" do
    assert ApplicationController.ancestors.include?(Authentication)
  end

  test "includes Authorization concern" do
    assert ApplicationController.ancestors.include?(Authorization)
  end
end
