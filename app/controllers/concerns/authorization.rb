module Authorization
  extend ActiveSupport::Concern

  class_methods do
    def require_role(*roles, **options)
      before_action(**options) do
        unless roles.any? { |role| Current.user&.public_send(:"#{role}?") }
          #          redirect_to root_path, alert: "Not authorized."
        end
      end
    end
  end
end
