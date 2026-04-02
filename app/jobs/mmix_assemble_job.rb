class MMIXAssembleJob < ApplicationJob
  queue_as :default
  discard_on ActiveRecord::RecordNotFound
   # Public: passes the program body to shell_out and updates executable with the result.
   #
   # program  - The ActiveRecord containing the source code to be assembled.
   # executable - The ActiveRecord to contain the assembled binary.
   #
   # Returns none.
   def perform(program, executable)
     begin
       result = Shell::ShellOperations.shell_out(
         program.title,
         Shell::MMIXStrategyAssembler.new,
         program.body,
         Rails.configuration.assembler_timeout,)
     rescue
       result = [ -1 ].pack("q>")
       success = false
     else
       success = true
     ensure
       executable.update(successfully_assembled: success, bin: result)
     end
   end
end
