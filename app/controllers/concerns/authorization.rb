# Provides role-based authorization for controllers.
#
# When included, controllers can restrict actions to users with specific
# roles using the require_role class method.
module Authorization
  extend ActiveSupport::Concern

  class_methods do
    # Public: Restricts controller actions to users with one of the given
    # roles. Responds with 403 Forbidden if the current user lacks the
    # required role.
    #
    # roles   - One or more Symbol role names (e.g. :admin).
    # options - Hash of options passed to before_action (e.g. only:,
    #           except:).
    #
    # Examples
    #
    #   require_role :admin
    #   require_role :admin, :editor, only: [:update, :destroy]
    #
    # Returns nothing.
    def require_role(*roles, **options)
      before_action(**options) do
        unless roles.any? { |role| Current.user&.public_send(:"#{role}?") }
          head :forbidden
        end
      end
    end
  end
end
