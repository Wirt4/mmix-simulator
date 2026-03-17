# Base controller for the application. All controllers inherit from this class.
#
# Includes authentication behavior and restricts access to modern browsers.
# Automatically invalidates ETags when the importmap changes.
class ApplicationController < ActionController::Base
  include Authentication, Authorization
  allow_browser versions: :modern
  stale_when_importmap_changes
end
