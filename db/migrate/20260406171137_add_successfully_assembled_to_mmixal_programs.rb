class AddSuccessfullyAssembledToMMIXALPrograms < ActiveRecord::Migration[8.1]
  def change
    add_column :mmixal_programs, :successfully_assembled, :boolean
  end
end
