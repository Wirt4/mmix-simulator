class RenameColumnsProgramToMMIXALProgram < ActiveRecord::Migration[8.1]
  def change
    rename_column :executables, :program, :mmixal_program
  end
end
