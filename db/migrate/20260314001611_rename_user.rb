class RenameUser < ActiveRecord::Migration[8.1]
  def change
    rename_column :users, :username, :user_name
  end
end
