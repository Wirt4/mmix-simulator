# Public: Strategy for running MMIX machine code through the mmix simulator.
# Accepts optional SimulatorConfig object.
module Shell
  class MMIXStrategySimulator < Shell::AbstractMMIXStrategy
    # Public: Initialize the simulator strategy.
    #
    # config - SimulatorConfig object (default: nil).
    def initialize(config = nil)
      raise TypeError, "Expected SimulatorConfig, got #{config.class}" if config && !config.is_a?(SimulatorConfig)
      @config = config || SimulatorConfig.new
    end

    # Public: Write MMIX machine code to an executable file in the working
    # directory.
    # title         - String name of the document, no file extension
    # dir          - String path to the working directory.
    # machine_code - String binary machine code to write.
    #
    # Returns nothing.
    def write(title, dir, package)
      Shell::ShellOperations.write_to_file(dir, title, ".mms", package[:src])
      Shell::ShellOperations.write_to_file(dir, title, ".mmo", package[:bin])
    end

    # Public: Run the simulator against the executable inside a bubblewrap
    # sandbox, passing any configured flags.
    #
    # dir     - String path to the working directory containing executable.mmo.
    # timeout - Integer seconds before the command is killed.
    #
    # Returns the result of ShellOperations.execute_with_timeout.
    def run(title, dir, timeout)
      command = [
        "landrun-and-limit",
        "--rox", "/usr",
        "--rox", "/lib",
        "--ro", "/etc",
        "--ro", dir,
        "--rlimit-as", "#{Rails.application.config.mmix_virtual_memory_limit_bytes}",
        "--rlimit-fsize", "#{Rails.application.config.mmix_file_size_limit_bytes}",
        "mmix",
        *@config.to_flags,
        "#{title}.mmo"
      ]

      Shell::ShellOperations.execute_with_timeout(dir, command, timeout)
    end
  end
end
