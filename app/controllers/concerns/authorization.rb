# Public: Provides role-based authorization for controllers.
#
# When included in a controller, exposes require_role as a class-level
# helper to gate actions behind specific roles. Role checks run after
# Authentication's require_authentication before_action, so Current.user
# is always present when the check executes.
#
# Examples
#
#   class UsersController < ApplicationController
#     require_role :admin
#   end
#
#   class ReportsController < ApplicationController
#     require_role :admin, only: [:export]
#   end
module Authorization
  extend ActiveSupport::Concern

  class_methods do
    # Public: Adds a before_action that restricts access to users with one
    # of the given roles. Non-matching users are redirected to root with
    # a "Not authorized." alert.
    #
    # roles   - One or more Symbol role names (e.g. :admin, :user).
    # options - Hash of options forwarded to before_action (e.g. only:,
    #           except:).
    #
    # Examples
    #
    #   require_role :admin
    #   require_role :admin, only: [:index, :destroy]
    #
    # Returns nothing.
    def require_role(*roles, **options)
      before_action(**options) do
        unless roles.include?(Current.user.role.to_sym)
          redirect_to root_path, alert: "Not authorized."
        end
      end
    end
  end
end
