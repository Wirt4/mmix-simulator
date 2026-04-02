# Provides authentication behavior for controllers.
#
# When included, requires authentication for all actions by default.
# Controllers can opt out of authentication for specific actions using
# allow_unauthenticated_access.
module Authentication
  extend ActiveSupport::Concern

  included do
    before_action :require_authentication
    helper_method :authenticated?
  end
  # Public: Skips authentication for specific actions in a controller.
  #
  # options - Hash of options passed to skip_before_action (e.g. only:,
  #           except:).
  #
  # Examples
  #
  #   allow_unauthenticated_access only: [:index, :show]
  #
  # Returns nothing.
  class_methods do
    def allow_unauthenticated_access(**options)
      skip_before_action :require_authentication, **options
    end
  end

  private
    # Private: Returns whether a valid session exists for the current
    # request.
    #
    # Returns truthy Session or nil.
    def authenticated?
      resume_session
    end

    # Private: Ensures the request has an active session, redirecting to
    # login if not.
    def require_authentication
      resume_session || request_authentication
    end

    # Private: Restores the current session from the signed cookie.
    #
    # Returns the Session if found, or nil.
    def resume_session
      Current.session ||= find_session_by_cookie
    end

    # Private: Looks up a Session by the signed session_id cookie.
    #
    # Returns a Session or nil.
    def find_session_by_cookie
      Session.find_by(id: cookies.signed[:session_id]) if cookies.signed[:session_id]
    end

    # Private: Stores the current URL and redirects to the login page.
    def request_authentication
      session[:return_to_after_authenticating] = request.url
      redirect_to new_session_path
    end

    # Private: Returns the URL to redirect to after login, falling back
    # to root.
    #
    # Returns a String URL.
    def after_authentication_url
      session.delete(:return_to_after_authenticating) || root_url
    end

    # Private: Creates a new Session for the given user and sets the
    # signed session cookie.
    #
    # user - The User to start a session for.
    #
    # Returns the newly created Session.
    def start_new_session_for(user)
      user.sessions.create!(user_agent: request.user_agent, ip_address: request.remote_ip).tap do |session|
        Current.session = session
        cookies.signed.permanent[:session_id] = { value: session.id, httponly: true, same_site: :lax }
      end
    end

    # Private: Destroys the current session and removes the session cookie.
    def terminate_session
      Current.session.destroy
      cookies.delete(:session_id)
    end
end
