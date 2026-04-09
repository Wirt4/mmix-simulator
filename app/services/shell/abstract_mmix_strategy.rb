# Public: Abstract base class defining the interface for MMIX operation
# strategies. Subclasses implement writing source/binary files and running
# the corresponding MMIX tool (assembler or simulator).
module Shell
  class AbstractMMIXStrategy
    # Public: Write program content to a file in the given directory.
    # title   - String title of the document to write, no file extensions
    # dir     - String path to the working directory.
    # content - String content to write (source code or machine code).
    #
    # Raises RuntimeError (abstract method).
    def write(title, dir, content)
      raise NotImplementedError, "#{self.class}#write must be implemented"
    end

    # Public: Run the MMIX tool against the written file.
    # title   - String title of the document to run, no file extensions
    # dir     - String path to the working directory.
    # timeout - Integer seconds before the command is killed.
    #
    # Raises RuntimeError (abstract method).
    def run(title, dir, timeout)
       raise NotImplementedError, "#{self.class}#run must be implemented"
    end

    private

    # Private: Build the common landrun-and-limit sandbox prefix.
    #
    # dir         - String path to the working directory.
    # dir_mode    - String sandbox permission for dir ("--rw" or "--ro").
    # extra_flags - Array of additional sandbox flags (e.g. rlimit flags).
    #
    # Returns an Array of Strings.
    def sandbox_command(dir, dir_mode: "--rw", extra_flags: [])
      [
        "landrun-and-limit",
        "--rox", "/usr",
        "--rox", "/lib",
        "--ro", "/etc",
        dir_mode, dir,
        *extra_flags
      ]
    end
  end
end
