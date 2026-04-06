class RenameProgramToMMIXALProgram < ActiveRecord::Migration[8.1]
  def change
    rename_table :programs, :mmixal_programs
  end
end
