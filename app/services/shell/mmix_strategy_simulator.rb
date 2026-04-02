# Public: Strategy for running MMIX machine code through the mmix simulator.
# Accepts optional configuration flags that map to mmix command-line options.
# Only single-run flags are permitted; interactive mode and help flags are
# excluded for security.
module Shell
  class MMIXStrategySimulator < Shell::AbstractMMIXStrategy
    # Public: Initialize the simulator strategy.
    #
    # config - Hash of Symbol flag keys to their values (default: { empty: nil }).
    #          Keys must be members of SANCTIONED_FLAGS to be included.
    #        Check https://mmix.cs.hm.edu/doc/mmix-sim.pdf for the full list
    def initialize(config = { empty: nil })
      @config = config
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
        "--rlimit-as", "#{ Rails.application.config.mmix_virtual_memory_limit_bytes}",
        "--rlimit-fsize", "#{ Rails.application.config.mmix_file_size_limit_bytes}",
        "mmix", *parse_flags, "#{title}.mmo"
      ]

      Shell::ShellOperations.execute_with_timeout(dir, command, timeout)
    end

    private
    SANCTIONED_FLAGS = %i[t e r l s P L v q b c f D].freeze

    # Private: Converts the config hash into command-line flag strings,
    # filtering to only SANCTIONED_FLAGS and validating value types.
    #
    # Returns Array of String flags (e.g. ["-t100", "-v"]).
    def parse_flags
      @config.except(:empty).filter_map do |key, value|
        next unless SANCTIONED_FLAGS.include?(key)
        case key
        when :t, :b, :c
            next unless value.is_a?(Integer)
            "-#{key}#{value}"
        when :e
            next unless value.is_a?(Integer) || value == true
            next if value.is_a?(Integer) && value.to_s(16) !~ /[a-f]/
            value == true ? "-#{key}" : "-#{key}#{value.to_s(16)}"
        when :r, :s, :P, :v, :q
            next unless value == true
            "-#{key}"
        when :L, :l
            next unless value == true || value.is_a?(Integer)
            value == true ? "-#{key}" : "-#{key}#{value}"
        when :f, :D
            next unless value.is_a?(String)
            "-#{key}#{value}"
        end
      end
    end
  end
end
