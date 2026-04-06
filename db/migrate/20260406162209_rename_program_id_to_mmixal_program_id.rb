class RenameProgramIdToMMIXALProgramId < ActiveRecord::Migration[8.1]
  def change
    rename_column :executables, :program_id, :mmixal_program_id
  end
end
