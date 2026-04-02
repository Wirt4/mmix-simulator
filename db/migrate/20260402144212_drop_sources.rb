class DropSources < ActiveRecord::Migration[8.1]
  def change
    drop_table :sources do |t|
      t.text :body
      t.string :title
      t.integer :user_id, null: false
      t.timestamps
      t.index :user_id
    end
  end
end
