# Public: Controller for the public-facing console page.
#
# Bypasses authentication so that any visitor can access the console
# without needing to log in.
class ConsoleController < ApplicationController
  allow_unauthenticated_access
end
