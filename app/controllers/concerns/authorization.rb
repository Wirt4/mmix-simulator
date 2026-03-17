module Authorization
  extend ActiveSupport::Concern

  class_methods do
    def require_role(*roles, **options)
      before_action(**options) { }
    end
  end
end
