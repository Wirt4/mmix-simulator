require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)
def mib_to_bytes(mib)
  mib * (1024 ** 2)
end
module MMIXSimulator
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.1

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w[assets tasks])

    # quantitis are in binary MBs, MiB
    config.mmix_virtual_memory_limit = 75
    config.mmix_file_size_limit = 128
    # so don't have to get fiddly
    config.mmix_virtual_memory_limit_bytes = mib_to_bytes(config.mmix_virtual_memory_limit)
    config.mmix_file_size_limit_bytes = mib_to_bytes(config.mmix_file_size_limit)
    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")
    config.assembler_timeout = 8
    config.simulator_timeout = 45
  end
end
