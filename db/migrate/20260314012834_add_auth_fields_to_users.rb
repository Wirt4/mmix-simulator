class AddAuthFieldsToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :email_address, :string
    add_index :users, :email_address, unique: true
    add_column :users, :password_digest, :string
  end
end
