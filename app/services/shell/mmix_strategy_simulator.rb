module Shell
  class MmixStrategySimulator < Shell::AbstractMmixStrategy
    def initialize(config = { empty: nil })
      @config = config
    end

    def write(dir, machine_code)
      Shell::ShellOperations.writeToFile(dir, "executable.mmo", machine_code)
    end

    def run(dir, timeout)
      command = [ "bwrap-seccomp", "-e", "mmix", *parse_flags, "executable.mmo" ]
      Shell::ShellOperations.executeWithTimeout(dir, command, timeout)
    end

    private
    # only the single- run flags for the mmix simulator, not accessing interactive mode or help
    SANCTIONED_FLAGS = %i[t e r l s P L v q b c f D].freeze

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
