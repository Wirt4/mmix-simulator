# Public: Abstract base class defining the interface for MMIX operation
# strategies. Subclasses implement writing source/binary files and running
# the corresponding MMIX tool (assembler or simulator).
module Shell
  class AbstractMmixStrategy
    # Public: Write program content to a file in the given directory.
    # title   - String title of the document to write, no file extensions
    # dir     - String path to the working directory.
    # content - String content to write (source code or machine code).
    #
    # Raises RuntimeError (abstract method).
    def write(title, dir, content)
      raise "abstract method"
    end

    # Public: Run the MMIX tool against the written file.
    # title   - String title of the document to run, no file extensions
    # dir     - String path to the working directory.
    # timeout - Integer seconds before the command is killed.
    #
    # Raises RuntimeError (abstract method).
    def run(title, dir, timeout)
      raise "abstract method"
    end
  end
end
