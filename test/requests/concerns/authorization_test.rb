require "test_helper"

class AuthorizationTest < ActiveSupport::TestCase
  class FakeController
    include ActiveSupport::Callbacks
    define_callbacks :action

    class << self
      attr_reader :before_actions

      def before_action(**options, &block)
        @before_actions ||= []
        @before_actions << { options: options, block: block }
      end
    end

    include Authorization

    attr_accessor :redirected_to, :redirect_alert

    def redirect_to(path, alert: nil)
      @redirected_to = path
      @redirect_alert = alert
    end

    def root_path
      "/"
    end
  end

  test "require_role registers a before_action" do
    klass = Class.new(FakeController) do
      require_role :admin
    end

    assert_equal 1, klass.before_actions.length
  end

  test "require_role redirects when user role is not in allowed roles" do
    klass = Class.new(FakeController) do
      require_role :admin
    end

    controller = klass.new
    user = users(:one)
    assert user.user?

    Current.set(session: user.sessions.create!) do
      controller.instance_exec(&klass.before_actions.first[:block])
    end

    assert_equal "/", controller.redirected_to
    assert_equal "Not authorized.", controller.redirect_alert
  end

=begin
  test "require_role does not redirect when user role is in allowed roles" do
    klass = Class.new(FakeController) do
      require_role :admin
    end

    controller = klass.new
    admin = users(:admin)
    assert admin.admin?

    Current.set(session: admin.sessions.create!) do
      controller.instance_exec(&klass.before_actions.first[:block])
    end

    assert_nil controller.redirected_to
  end

  test "require_role accepts multiple roles" do
    klass = Class.new(FakeController) do
      require_role :user, :admin
    end

    controller = klass.new
    user = users(:one)

    Current.set(session: user.sessions.create!) do
      controller.instance_exec(&klass.before_actions.first[:block])
    end

    assert_nil controller.redirected_to
  end

  test "require_role allows admin when multiple roles specified" do
    klass = Class.new(FakeController) do
      require_role :user, :admin
    end

    controller = klass.new
    admin = users(:admin)

    Current.set(session: admin.sessions.create!) do
      controller.instance_exec(&klass.before_actions.first[:block])
    end

    assert_nil controller.redirected_to
  end
=end
end
