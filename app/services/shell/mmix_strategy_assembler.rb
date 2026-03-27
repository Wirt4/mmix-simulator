module Shell
  class MmixStrategyAssembler < Shell::AbstractMmixStrategy
    def write(dir, program_code)
      file_path = File.join(dir, "program.mms")
      File.write(file_path, program_code)
    end

    def run(dir, timeout)
      command = [ "bwrap-seccomp", "-a", "program.mms" ]
      Shell::ShellOperations.executeWithTimeout(dir, command, timeout)
      0b0110100001100101011011000110110001101111001000000111011101101111011100100110110001100100
    end
  end
end
