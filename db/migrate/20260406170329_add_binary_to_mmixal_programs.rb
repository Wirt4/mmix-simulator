class AddBinaryToMMIXALPrograms < ActiveRecord::Migration[8.1]
  def change
    add_column :mmixal_programs, :binary, :binary
  end
end
