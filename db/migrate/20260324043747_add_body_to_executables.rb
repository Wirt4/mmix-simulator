class AddBodyToExecutables < ActiveRecord::Migration[8.1]
  def change
    add_column :executables, :body, :text
  end
end
