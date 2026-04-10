require "test_helper"

# Public: Unit tests for MMIXALProgramController.
#
# Verifies the controller's inheritance and that it requires
# authentication for all actions.
class MMIXALProgramControllerTest < ActiveSupport::TestCase
  test "inherits from ApplicationController" do
    assert MMIXALProgramController < ApplicationController
  end

  test "requires authentication" do
    auth_callback = MMIXALProgramController._process_action_callbacks.find do |cb|
      cb.kind == :before && cb.filter == :require_authentication
    end

    assert_not_nil auth_callback, "require_authentication should be required for all actions"
  end
end
