require "test_helper"

# Public: Unit tests for ApplicationController.
#
# Verifies that the base controller includes the expected concerns
# and behaviors inherited by all other controllers.
class ApplicationControllerTest < ActiveSupport::TestCase
  # Public: Verify that the Authentication concern is mixed into
  # ApplicationController, ensuring all controllers enforce authentication.
  test "includes Authentication concern" do
    assert ApplicationController.ancestors.include?(Authentication)
  end
end
