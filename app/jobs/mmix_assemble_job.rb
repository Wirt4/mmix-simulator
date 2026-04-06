class MMIXAssembleJob < ApplicationJob
  queue_as :default
  discard_on ActiveRecord::RecordNotFound
   # Public: passes the program body to shell_out and updates executable with the result.
   #
   # program  - The ActiveRecord containing the source code to be assembled and rewritten to the binary field
   #
   # Returns none.
   def perform(mmixal_program)
     begin
       result = Shell::ShellOperations.shell_out(
         mmixal_program.title,
         Shell::MMIXStrategyAssembler.new,
         mmixal_program.body,
         Rails.configuration.assembler_timeout,)
     rescue
       result = [ -1 ].pack("q>")
       success = false
     else
       success = true
     ensure
       mmixal_program.update(successfully_assembled: success, binary: result)
     end
   end
end
