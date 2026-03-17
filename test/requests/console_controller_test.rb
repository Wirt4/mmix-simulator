require "test_helper"

# Public: Unit tests for ConsoleController.
#
# Verifies the controller's inheritance and that it permits
# unauthenticated access to all actions.
class ConsoleControllerTest < ActiveSupport::TestCase
  test "inherits from ApplicationController" do
    assert ConsoleController < ApplicationController
  end

  test "allows unauthenticated access" do
    auth_callback = ConsoleController._process_action_callbacks.find do |cb|
      cb.kind == :before && cb.filter == :require_authentication
    end

    assert_nil auth_callback, "require_authentication should be skipped for all actions"
  end
end
