class ReplaceExecutableWithMMIXALProgramInOutputs < ActiveRecord::Migration[8.1]
  def change
    remove_reference :outputs, :executable, index: true, foreign_key: true
    add_reference :outputs, :mmixal_program, null: false, foreign_key: true
  end
end
