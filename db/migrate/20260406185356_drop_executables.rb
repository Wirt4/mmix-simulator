class DropExecutables < ActiveRecord::Migration[8.1]
  def change
    drop_table :executables
  end
end
