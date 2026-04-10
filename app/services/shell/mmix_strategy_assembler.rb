# Public: Strategy for assembling MMIX source code into machine code using
# mmixal. Writes a .mms source file and runs the assembler inside a
# bubblewrap sandbox, returning the resulting .mmo binary.
module Shell
  class MMIXStrategyAssembler < Shell::AbstractMMIXStrategy
    # Public: Write MMIX assembly source to a file in the working directory.
    # title        - name of file to write, no file extension
    # dir          - String path to the working directory.
    # program_code - String MMIX assembly source code.
    #
    # Returns nothing.
    def write(title, dir, program_code)
      Shell::ShellOperations.write_to_file(dir, title, ".mms", program_code)
    end

    # Public: Assemble the source file with mmixal and return the object file.
    #
    # title        - name of file to write, no file extension

    # dir     - String path to the working directory containing program.mms.
    # timeout - Integer seconds before the command is killed.
    #
    # Returns String binary contents of the assembled program.mmo.
    def run(title, dir, timeout)
      command = [
        "landrun-and-limit",
        "--rox", "/usr",
        "--rox", "/lib",
        "--ro", "/etc",
        "--rw", dir,
        "mmixal", "#{title}.mms"
      ]
      result = Shell::ShellOperations.execute_with_timeout(dir, command, timeout)
      if !result[2].success?
        raise result[1]
      end
      File.binread(File.join(dir, "#{title}.mmo"))
    end
  end
end
