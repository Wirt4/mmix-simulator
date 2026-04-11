class RenameBodyToSourceInMMIXALPrograms < ActiveRecord::Migration[8.1]
  def change
    rename_column :mmixal_programs, :body, :source
  end
end
