module Shell
  class MmixStrategyAssembler < Shell::AbstractMmixStrategy
    def write(dir, program_code)
      Shell::ShellOperations.writeToFile(dir, "program.mms", program_code)
    end

    def run(dir, timeout)
      command = [ "bwrap-seccomp", "-a", "mmixal", "program.mms" ]
      Shell::ShellOperations.executeWithTimeout(dir, command, timeout)
      File.read(File.join(dir, "program.mmo"), mode: "rb")
    end
  end
end
