# test/support/sandbox_integration_test.rb
require "test_helper"

class SandboxIntegrationTest < ActionDispatch::IntegrationTest
  def setup
    skip "Sandbox not supported" unless sandbox_supported?
  end

  private

  def sandbox_supported?
    ENV["RUN_SANDBOX_TESTS"]
  end
end
