require "test_helper"

class AuthenticationTest < ActiveSupport::TestCase
  class TestController
    include ActiveSupport::Callbacks
    define_callbacks :action

    class << self
      attr_reader :before_actions, :skipped_before_actions, :helper_methods_list

      def before_action(method_name, **options)
        @before_actions ||= []
        @before_actions << { method: method_name, options: options }
        set_callback :action, :before, method_name
      end

      def skip_before_action(method_name, **options)
        @skipped_before_actions ||= []
        @skipped_before_actions << { method: method_name, options: options }
      end

      def helper_method(*methods)
        @helper_methods_list ||= []
        @helper_methods_list.concat(methods)
      end
    end

    include Authentication
  end

  test "registers require_authentication as a before_action" do
    actions = TestController.before_actions.map { |a| a[:method] }
    assert_includes actions, :require_authentication
  end

  test "declares authenticated? as a helper method" do
    assert_includes TestController.helper_methods_list, :authenticated?
  end

  test "allow_unauthenticated_access skips require_authentication" do
    klass = Class.new(TestController) do
      allow_unauthenticated_access only: :index
    end

    skipped = klass.skipped_before_actions
    assert_equal 1, skipped.length
    assert_equal :require_authentication, skipped.first[:method]
    assert_equal({ only: :index }, skipped.first[:options])
  end
end
