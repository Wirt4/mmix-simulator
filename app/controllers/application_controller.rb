# Base controller for the application. All controllers inherit from this class.
#
# Includes authentication behavior and restricts access to modern browsers.
# Automatically invalidates ETags when the importmap changes.
class ApplicationController < ActionController::Base
  include Authentication

  # Only allow modern browsers supporting webp images, web push, badges,
  # import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # Invalidates the ETag for HTML responses whenever the importmap changes,
  # ensuring clients receive fresh assets after deploys.
  stale_when_importmap_changes
end
